using System;
using System.IO;

namespace GateKPT.MusicOS.Services;

public sealed class RecorderDiagnosticLog
{
    public RecorderDiagnosticLog(string rootDirectory)
    {
        Directory.CreateDirectory(rootDirectory);
        Path = System.IO.Path.Combine(rootDirectory, "recorder-diagnostics.txt");
    }

    public string Path { get; }

    public void Write(string message)
    {
        try
        {
            File.AppendAllText(
                Path,
                $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}{Environment.NewLine}");
        }
        catch
        {
            // Diagnostics must never break recording.
        }
    }
}
