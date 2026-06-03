using System;
using System.IO;
using System.Linq;
using System.Threading;

namespace GateKPT.MusicOS.Services;

public sealed class RecordingSmokeTestCliService
{
    private readonly LayerRecordingService _recorder = new();
    private readonly AudioInputDeviceService _inputs = new();
    private readonly PlayableTakeRepairService _repair = new();

    public int Run(TextWriter output)
    {
        var root = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.MyMusic),
            "GateKPT Recorder",
            "diagnostics",
            "recording-smoke");
        Directory.CreateDirectory(root);

        var input = _inputs.ListInputs().FirstOrDefault(input => input.IsPreferred)
            ?? _inputs.ListInputs().FirstOrDefault();
        if (input is null)
        {
            output.WriteLine("FAIL: no active recording input.");
            return 2;
        }

        output.WriteLine($"GateKPT recording smoke test: {input.Name}");
        var start = _recorder.Start(input.Name, root, "smoke-test", peak =>
        {
            output.WriteLine($"peak={peak:0.0}%");
        });

        if (!start.Success)
        {
            output.WriteLine($"FAIL: {start.Message}");
            return 3;
        }

        Thread.Sleep(TimeSpan.FromSeconds(3));
        var stop = _recorder.Stop();
        output.WriteLine(stop.Message);

        if (!File.Exists(stop.Path))
        {
            output.WriteLine("FAIL: no smoke test file created.");
            return 4;
        }

        var preview = AudioPreviewService.Inspect(stop.Path);
        output.WriteLine($"File: {stop.Path}");
        output.WriteLine($"Preview: duration={preview.Duration}, peak={preview.Peak}, waveform={preview.Waveform}");
        if (preview == AudioPreview.Empty || preview.Duration is "--:--" or "00:00")
        {
            output.WriteLine("FAIL: recorder created an unreadable or sub-second file.");
            return 5;
        }

        var repair = _repair.RepairToPlayableStereo(stop.Path);
        output.WriteLine(repair.Message);
        if (!repair.Success || !File.Exists(repair.Path))
        {
            output.WriteLine("FAIL: recorder captured audio, but could not repair it into a playable stereo take.");
            return 6;
        }

        var repaired = AudioPreviewService.InspectMetrics(repair.Path);
        output.WriteLine($"Playable: duration={repaired.Duration:mm\\:ss}, peak={repaired.PeakPercent:0.0}%, RMS={repaired.RmsPercent:0.00}%, waveform={repaired.Waveform}");
        if (!repaired.Success || repaired.Duration.TotalSeconds < 0.75 || repaired.PeakPercent < 1.5 || repaired.RmsPercent < 0.25)
        {
            output.WriteLine("FAIL: repaired take does not contain enough sustained signal.");
            return 7;
        }

        output.WriteLine("PASS: recorder captured and repaired a playable stereo take.");
        return 0;
    }
}
