using System;
using System.Diagnostics;
using System.IO;
using System.Linq;

namespace GateKPT.MusicOS.Services;

public sealed class ScreenCaptureService
{
    private Process? _process;
    private string _activePath = "";

    public bool IsRecording => _process is not null && !_process.HasExited;

    public string OutputDirectory { get; } = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.MyVideos),
        "GateKPT Screen Captures");

    public ScreenCaptureResult Start(string? audioDeviceName)
    {
        if (IsRecording)
        {
            return ScreenCaptureResult.Fail("Screen capture is already recording.");
        }

        var ffmpeg = ResolveTool("ffmpeg.exe");
        if (string.IsNullOrWhiteSpace(ffmpeg))
        {
            return ScreenCaptureResult.Fail("FFmpeg not found. Install FFmpeg before screen capture.");
        }

        Directory.CreateDirectory(OutputDirectory);
        _activePath = AutoSaveFileNamer.CreatePath(OutputDirectory, "gatekpt-screen-capture", ".mp4");

        var hasAudio = !string.IsNullOrWhiteSpace(audioDeviceName);
        var args = BuildArguments(_activePath, audioDeviceName);

        try
        {
            _process = Process.Start(new ProcessStartInfo
            {
                FileName = ffmpeg,
                Arguments = args,
                CreateNoWindow = true,
                RedirectStandardError = true,
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                UseShellExecute = false,
            });

            if (_process is null)
            {
                _activePath = "";
                return ScreenCaptureResult.Fail("Could not start screen capture.");
            }

            _ = _process.StandardError.ReadToEndAsync();
            _ = _process.StandardOutput.ReadToEndAsync();

            if (hasAudio && _process.WaitForExit(900))
            {
                _process.Dispose();
                _activePath = AutoSaveFileNamer.CreatePath(OutputDirectory, "gatekpt-screen-capture-video-only", ".mp4");
                _process = StartFfmpeg(ffmpeg, BuildArguments(_activePath, null));
                if (_process is null)
                {
                    _activePath = "";
                    return ScreenCaptureResult.Fail("Audio capture failed, and video-only fallback could not start.");
                }

                _ = _process.StandardError.ReadToEndAsync();
                _ = _process.StandardOutput.ReadToEndAsync();
                return ScreenCaptureResult.Ok(_activePath, "Screen capture started video-only. Scarlett audio did not attach to FFmpeg.");
            }

            var audioLabel = hasAudio ? $" with {audioDeviceName}" : " without app audio";
            return ScreenCaptureResult.Ok(_activePath, $"Screen capture started{audioLabel}.");
        }
        catch (Exception ex)
        {
            _process = null;
            _activePath = "";
            return ScreenCaptureResult.Fail($"Could not start screen capture: {ex.Message}");
        }
    }

    private static Process? StartFfmpeg(string ffmpeg, string args) =>
        Process.Start(new ProcessStartInfo
        {
            FileName = ffmpeg,
            Arguments = args,
            CreateNoWindow = true,
            RedirectStandardError = true,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            UseShellExecute = false,
        });

    private static string BuildArguments(string outputPath, string? audioDeviceName)
    {
        if (!string.IsNullOrWhiteSpace(audioDeviceName))
        {
            return "-y -hide_banner -f gdigrab -framerate 30 -i desktop " +
                   $"-f dshow -i audio=\"{audioDeviceName}\" " +
                   "-map 0:v:0 -map 1:a:0 -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p " +
                   "-c:a aac -b:a 192k -movflags +faststart " +
                   $"\"{outputPath}\"";
        }

        return "-y -hide_banner -f gdigrab -framerate 30 -i desktop " +
               "-c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p -movflags +faststart " +
               $"\"{outputPath}\"";
    }

    public ScreenCaptureResult Stop()
    {
        var process = _process;
        var path = _activePath;
        _process = null;
        _activePath = "";

        if (process is null)
        {
            return ScreenCaptureResult.Fail("No active screen capture.");
        }

        try
        {
            if (!process.HasExited)
            {
                process.StandardInput.WriteLine("q");
                if (!process.WaitForExit(TimeSpan.FromSeconds(8)))
                {
                    process.Kill(entireProcessTree: true);
                }
            }
        }
        catch
        {
            try
            {
                if (!process.HasExited)
                {
                    process.Kill(entireProcessTree: true);
                }
            }
            catch
            {
                // Best-effort shutdown.
            }
        }
        finally
        {
            process.Dispose();
        }

        return File.Exists(path) && new FileInfo(path).Length > 1024
            ? ScreenCaptureResult.Ok(path, $"Screen capture saved: {Path.GetFileName(path)}")
            : ScreenCaptureResult.Fail("Screen capture stopped, but no playable file was created.");
    }

    public void OpenOutputFolder()
    {
        Directory.CreateDirectory(OutputDirectory);
        Process.Start(new ProcessStartInfo
        {
            FileName = OutputDirectory,
            UseShellExecute = true
        });
    }

    private static string ResolveTool(string name)
    {
        var path = Environment.GetEnvironmentVariable("PATH") ?? "";
        foreach (var directory in path.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            var candidate = Path.Combine(directory.Trim(), name);
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        var wingetRoot = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Microsoft",
            "WinGet",
            "Packages");
        return Directory.Exists(wingetRoot)
            ? Directory.EnumerateFiles(wingetRoot, name, SearchOption.AllDirectories).FirstOrDefault() ?? ""
            : "";
    }
}

public sealed record ScreenCaptureResult(bool Success, string Path, string Message)
{
    public static ScreenCaptureResult Ok(string path, string message) => new(true, path, message);

    public static ScreenCaptureResult Fail(string message) => new(false, "", message);
}
