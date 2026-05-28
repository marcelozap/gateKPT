using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using NAudio.CoreAudioApi;
using NAudio.Wave;

namespace GateKPT.MusicOS.Services;

public sealed class FocusriteDiagnosticService
{
    public FocusriteDeviceSelection Detect()
    {
        try
        {
            using var enumerator = new MMDeviceEnumerator();
            var inputs = enumerator.EnumerateAudioEndPoints(DataFlow.Capture, DeviceState.Active);
            var outputs = enumerator.EnumerateAudioEndPoints(DataFlow.Render, DeviceState.Active);
            var input = inputs.FirstOrDefault(IsFocusrite);
            var output = outputs.FirstOrDefault(IsFocusrite);

            return new FocusriteDeviceSelection(
                input?.FriendlyName ?? "",
                output?.FriendlyName ?? "",
                input is not null,
                output is not null);
        }
        catch (Exception ex)
        {
            return new FocusriteDeviceSelection("", "", false, false, $"Focusrite scan failed: {ex.Message}");
        }
    }

    public async Task<FocusriteInputTestResult> RunInputTestAsync(string preferredInput, string outputDirectory, int seconds = 3)
    {
        var peak = 0f;
        WasapiCapture? capture = null;
        WaveFileWriter? writer = null;
        var path = "";

        try
        {
            Directory.CreateDirectory(outputDirectory);
            using var enumerator = new MMDeviceEnumerator();
            var device = FindInputDevice(enumerator, preferredInput);
            if (device is null)
            {
                return new FocusriteInputTestResult(false, "", 0, "No Focusrite/Scarlett input is active.");
            }

            path = Path.Combine(outputDirectory, $"focusrite-test-{DateTime.Now:yyyyMMdd-HHmmss}.wav");
            capture = new WasapiCapture(device);
            writer = new WaveFileWriter(path, capture.WaveFormat);
            capture.DataAvailable += (_, args) =>
            {
                writer.Write(args.Buffer, 0, args.BytesRecorded);
                writer.Flush();
                peak = Math.Max(peak, CalculatePeak(args.Buffer, args.BytesRecorded));
            };
            capture.StartRecording();
            await Task.Delay(TimeSpan.FromSeconds(Math.Clamp(seconds, 1, 10)));
            capture.StopRecording();
            return new FocusriteInputTestResult(
                true,
                path,
                Math.Round(peak * 100, 1),
                $"Focusrite test captured from {device.FriendlyName}. Peak {peak * 100:0.0}%.");
        }
        catch (Exception ex)
        {
            return new FocusriteInputTestResult(false, path, Math.Round(peak * 100, 1), $"Focusrite input test failed: {ex.Message}");
        }
        finally
        {
            writer?.Dispose();
            capture?.Dispose();
        }
    }

    private static MMDevice? FindInputDevice(MMDeviceEnumerator enumerator, string preferredInput)
    {
        var devices = enumerator.EnumerateAudioEndPoints(DataFlow.Capture, DeviceState.Active);
        return devices.FirstOrDefault(device =>
                !string.IsNullOrWhiteSpace(preferredInput)
                && (device.FriendlyName.Contains(preferredInput, StringComparison.OrdinalIgnoreCase)
                    || preferredInput.Contains(device.FriendlyName, StringComparison.OrdinalIgnoreCase)))
            ?? devices.FirstOrDefault(IsFocusrite)
            ?? devices.FirstOrDefault();
    }

    private static bool IsFocusrite(MMDevice device) =>
        device.FriendlyName.Contains("focusrite", StringComparison.OrdinalIgnoreCase)
        || device.FriendlyName.Contains("scarlett", StringComparison.OrdinalIgnoreCase);

    private static float CalculatePeak(byte[] buffer, int bytesRecorded)
    {
        var peak = 0f;
        for (var index = 0; index + 3 < bytesRecorded; index += 4)
        {
            var sample = BitConverter.ToSingle(buffer, index);
            if (!float.IsNaN(sample))
            {
                peak = Math.Max(peak, Math.Abs(sample));
            }
        }

        return Math.Clamp(peak, 0, 1);
    }
}

public sealed record FocusriteDeviceSelection(
    string InputName,
    string OutputName,
    bool HasInput,
    bool HasOutput,
    string Error = "")
{
    public bool Ready => HasInput && HasOutput;

    public string Summary => !string.IsNullOrWhiteSpace(Error)
        ? Error
        : Ready
            ? $"Focusrite ready: {InputName} / {OutputName}"
            : $"Focusrite partial: input {(HasInput ? InputName : "missing")} / output {(HasOutput ? OutputName : "missing")}";
}

public sealed record FocusriteInputTestResult(bool Success, string Path, double PeakPercent, string Message);
