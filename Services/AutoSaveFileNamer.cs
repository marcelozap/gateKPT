using System;
using System.IO;
using System.Linq;

namespace GateKPT.MusicOS.Services;

public static class AutoSaveFileNamer
{
    public const string Prefix = "XIV";

    public static string CreatePath(string directory, string label, string extension)
    {
        Directory.CreateDirectory(directory);
        var safeLabel = Sanitize(label);
        var safeExtension = extension.StartsWith('.') ? extension : $".{extension}";
        var takeNumber = Directory
            .GetFiles(directory, $"{safeLabel}-*{safeExtension}")
            .Length + 1;
        return Path.Combine(directory, $"{safeLabel}-{takeNumber:00}-{DateTime.Now:yyyyMMdd-HHmmss}{safeExtension}");
    }

    public static string Sanitize(string value)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var safe = new string(value.Select(character => invalid.Contains(character) ? '-' : character).ToArray());
        safe = safe.Trim().Replace(' ', '-').ToLowerInvariant();
        while (safe.Contains("--", StringComparison.Ordinal))
        {
            safe = safe.Replace("--", "-", StringComparison.Ordinal);
        }

        return string.IsNullOrWhiteSpace(safe) ? "autosave" : safe.Trim('-');
    }
}
