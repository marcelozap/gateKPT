using System;
using System.Diagnostics;
using System.IO;

namespace GateKPT.MusicOS.Services;

public sealed class FfmpegAudioExtractor
{
    public string? TryExtractMonoWav(string sourceMediaPath, string workDirectory)
    {
        if (string.IsNullOrWhiteSpace(sourceMediaPath) || !File.Exists(sourceMediaPath))
        {
            return null;
        }

        if (IsDirectAudio(sourceMediaPath))
        {
            return sourceMediaPath;
        }

        Directory.CreateDirectory(workDirectory);
        var target = Path.Combine(
            workDirectory,
            $"{Path.GetFileNameWithoutExtension(sourceMediaPath)}-{Guid.NewGuid():N}.sync.wav");

        try
        {
            using var process = Process.Start(new ProcessStartInfo
            {
                FileName = "ffmpeg",
                Arguments = $"-y -i \"{sourceMediaPath}\" -vn -ac 1 -ar 16000 -sample_fmt s16 \"{target}\"",
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
            });

            if (process is null)
            {
                return null;
            }

            process.WaitForExit(TimeSpan.FromSeconds(45));
            return process.ExitCode == 0 && File.Exists(target) ? target : null;
        }
        catch
        {
            return null;
        }
    }

    private static bool IsDirectAudio(string path)
    {
        var ext = Path.GetExtension(path).ToLowerInvariant();
        return ext is ".wav" or ".mp3" or ".aiff" or ".aif" or ".flac" or ".wma" or ".m4a";
    }
}
