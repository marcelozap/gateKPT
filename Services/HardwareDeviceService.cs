using System;
using System.Collections.Generic;
using System.Linq;
using NAudio.CoreAudioApi;
using NAudio.Midi;

namespace GateKPT.MusicOS.Services;

public sealed class HardwareDeviceService
{
    public HardwareScanResult Scan()
    {
        var audioInputs = ScanWasapi(DataFlow.Capture, "Audio input");
        var audioOutputs = ScanWasapi(DataFlow.Render, "Audio output");
        var midiInputs = ScanMidiInputs();
        var midiOutputs = ScanMidiOutputs();
        var allNames = audioInputs.Concat(audioOutputs).Concat(midiInputs).Concat(midiOutputs).Select(item => item.Name);

        return new HardwareScanResult(
            audioInputs,
            audioOutputs,
            midiInputs,
            midiOutputs,
            BuildSummary(allNames));
    }

    private static IReadOnlyList<HardwareDevice> ScanWasapi(DataFlow flow, string kind)
    {
        try
        {
            using var enumerator = new MMDeviceEnumerator();
            return enumerator
                .EnumerateAudioEndPoints(flow, DeviceState.Active)
                .Select(device => new HardwareDevice(device.ID, device.FriendlyName, kind, DetectRole(device.FriendlyName)))
                .OrderByDescending(device => device.Role != "General")
                .ThenBy(device => device.Name)
                .ToArray();
        }
        catch
        {
            return [];
        }
    }

    private static IReadOnlyList<HardwareDevice> ScanMidiInputs()
    {
        var devices = new List<HardwareDevice>();
        try
        {
            for (var i = 0; i < MidiIn.NumberOfDevices; i++)
            {
                var info = MidiIn.DeviceInfo(i);
                devices.Add(new HardwareDevice(i.ToString(), info.ProductName, "MIDI input", DetectRole(info.ProductName)));
            }
        }
        catch
        {
            return [];
        }

        return devices;
    }

    private static IReadOnlyList<HardwareDevice> ScanMidiOutputs()
    {
        var devices = new List<HardwareDevice>();
        try
        {
            for (var i = 0; i < MidiOut.NumberOfDevices; i++)
            {
                var info = MidiOut.DeviceInfo(i);
                devices.Add(new HardwareDevice(i.ToString(), info.ProductName, "MIDI output", DetectRole(info.ProductName)));
            }
        }
        catch
        {
            return [];
        }

        return devices;
    }

    private static string DetectRole(string name)
    {
        if (name.Contains("focusrite", StringComparison.OrdinalIgnoreCase)
            || name.Contains("scarlett", StringComparison.OrdinalIgnoreCase))
        {
            return "Focusrite";
        }

        if (name.Contains("rc-505", StringComparison.OrdinalIgnoreCase)
            || name.Contains("rc505", StringComparison.OrdinalIgnoreCase)
            || name.Contains("loop station", StringComparison.OrdinalIgnoreCase)
            || name.Contains("boss", StringComparison.OrdinalIgnoreCase))
        {
            return "RC-505";
        }

        return "General";
    }

    private static string BuildSummary(IEnumerable<string> names)
    {
        var list = names.ToArray();
        var focusrite = list.Any(name => name.Contains("focusrite", StringComparison.OrdinalIgnoreCase)
            || name.Contains("scarlett", StringComparison.OrdinalIgnoreCase));
        var rc505 = list.Any(name => name.Contains("rc-505", StringComparison.OrdinalIgnoreCase)
            || name.Contains("rc505", StringComparison.OrdinalIgnoreCase)
            || name.Contains("loop station", StringComparison.OrdinalIgnoreCase)
            || name.Contains("boss", StringComparison.OrdinalIgnoreCase));

        return (focusrite, rc505) switch
        {
            (true, true) => "Focusrite and RC-505 detected.",
            (true, false) => "Focusrite detected. RC-505 not detected yet.",
            (false, true) => "RC-505 detected. Focusrite not detected yet.",
            _ => "No Focusrite or RC-505 match detected. Connect USB devices, install drivers, then rescan.",
        };
    }
}

public sealed record HardwareScanResult(
    IReadOnlyList<HardwareDevice> AudioInputs,
    IReadOnlyList<HardwareDevice> AudioOutputs,
    IReadOnlyList<HardwareDevice> MidiInputs,
    IReadOnlyList<HardwareDevice> MidiOutputs,
    string Summary);

public sealed record HardwareDevice(string Id, string Name, string Kind, string Role)
{
    public string Label => Role == "General" ? $"{Kind}: {Name}" : $"{Role} - {Kind}: {Name}";
}
