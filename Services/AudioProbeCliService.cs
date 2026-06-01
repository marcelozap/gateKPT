using System;
using System.IO;
using System.Linq;

namespace GateKPT.MusicOS.Services;

public sealed class AudioProbeCliService
{
    private readonly AudioInputDeviceService _inputs = new();

    public int Run(TextWriter output)
    {
        var root = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.MyMusic),
            "GateKPT Recorder",
            "diagnostics");
        Directory.CreateDirectory(root);

        output.WriteLine("GateKPT audio probe");
        output.WriteLine($"Diagnostics: {root}");

        var devices = _inputs.ListInputs();
        if (devices.Count == 0)
        {
            output.WriteLine("No active Windows recording inputs found.");
            return 2;
        }

        output.WriteLine("Inputs:");
        foreach (var device in devices)
        {
            output.WriteLine($"- {device.Name} | preferred={device.IsPreferred}");
        }

        output.WriteLine("Recording 2-second probes from every input...");
        var results = _inputs.ProbeAllAsync(root, 2).GetAwaiter().GetResult();
        foreach (var result in results)
        {
            var status = result.Success ? "OK" : $"FAIL {result.Error}";
            output.WriteLine(
                $"{status} | peak={result.PeakPercent:0.0}% | rms={result.RmsPercent:0.00}% | bytes={result.BytesWritten} | {result.Name} | {Path.GetFileName(result.Path)}");
        }

        var best = results.FirstOrDefault(result => result.Success);
        if (best is null)
        {
            output.WriteLine("No input probe succeeded.");
            return 3;
        }

        output.WriteLine($"Best input: {best.Name}");
        output.WriteLine($"Best signal: peak={best.PeakPercent:0.0}%, rms={best.RmsPercent:0.00}%");
        output.WriteLine(best.RmsPercent >= 0.05 || best.PeakPercent >= 1
            ? "PASS: GateKPT sees input signal."
            : "FAIL: GateKPT can see the device, but no sustained input signal is arriving.");
        return best.RmsPercent >= 0.05 || best.PeakPercent >= 1 ? 0 : 1;
    }
}
