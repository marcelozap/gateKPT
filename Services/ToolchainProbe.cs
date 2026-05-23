using System;
using System.Diagnostics;

namespace GateKPT.MusicOS.Services;

public sealed class ToolchainProbe
{
    public ToolchainStatus Probe()
    {
        return new ToolchainStatus(IsCommandAvailable("ffmpeg"), IsCommandAvailable("ffprobe"));
    }

    private static bool IsCommandAvailable(string command)
    {
        try
        {
            using var process = Process.Start(new ProcessStartInfo
            {
                FileName = command,
                Arguments = "-version",
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
            });

            if (process is null)
            {
                return false;
            }

            process.WaitForExit(TimeSpan.FromSeconds(2));
            return process.ExitCode == 0;
        }
        catch
        {
            return false;
        }
    }
}

public sealed record ToolchainStatus(bool FfmpegAvailable, bool FfprobeAvailable)
{
    public string Label => FfmpegAvailable && FfprobeAvailable
        ? "FFmpeg ready"
        : "FFmpeg missing - audio files work now; video extraction next";

    public string Detail => FfmpegAvailable && FfprobeAvailable
        ? "Video extraction and review rendering are available."
        : "Install FFmpeg to unlock video-audio extraction and MP4 review exports.";

    public string WindowsInstallHint => "Windows: winget install Gyan.FFmpeg, then restart GateKPT Music OS.";
}
