using System;
using System.Collections.Generic;
using System.Linq;
using NAudio.CoreAudioApi;

namespace GateKPT.MusicOS.Services;

public sealed class AudioInputDeviceService
{
    public IReadOnlyList<AudioInputDeviceItem> ListInputs()
    {
        var inputs = new List<AudioInputDeviceItem>();
        try
        {
            using var enumerator = new MMDeviceEnumerator();
            inputs.AddRange(enumerator
                .EnumerateAudioEndPoints(DataFlow.Capture, DeviceState.Active)
                .Select(device => new AudioInputDeviceItem(
                    device.FriendlyName,
                    device.ID,
                    IsPreferred(device.FriendlyName))));
        }
        catch
        {
            return [];
        }

        return inputs
            .OrderByDescending(input => input.IsPreferred)
            .ThenBy(input => input.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static bool IsPreferred(string name) =>
        name.Contains("focusrite", StringComparison.OrdinalIgnoreCase)
        || name.Contains("scarlett", StringComparison.OrdinalIgnoreCase)
        || name.Contains("rc-505", StringComparison.OrdinalIgnoreCase)
        || name.Contains("boss", StringComparison.OrdinalIgnoreCase)
        || name.Contains("usb audio", StringComparison.OrdinalIgnoreCase);
}

public sealed record AudioInputDeviceItem(string Name, string Id, bool IsPreferred)
{
    public override string ToString() => Name;
}
