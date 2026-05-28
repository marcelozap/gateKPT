using System;
using System.Threading;
using System.Threading.Tasks;
using NAudio.Wave;
using NAudio.Wave.SampleProviders;

namespace GateKPT.MusicOS.Services;

public sealed class ClickTrackService
{
    public async Task PlayCountInAsync(int bpm, int beats, Action<int> onBeat, CancellationToken cancellationToken = default)
    {
        var safeBpm = Math.Clamp(bpm, 40, 240);
        var safeBeats = Math.Clamp(beats, 1, 16);
        var interval = TimeSpan.FromMilliseconds(60_000.0 / safeBpm);

        for (var beat = 1; beat <= safeBeats; beat++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            onBeat(beat);
            await PlayClickAsync(beat == 1 ? 1320 : 880, cancellationToken);
            await Task.Delay(interval, cancellationToken);
        }
    }

    private static async Task PlayClickAsync(double frequency, CancellationToken cancellationToken)
    {
        using var output = new WaveOutEvent();
        var signal = new SignalGenerator
        {
            Gain = 0.18,
            Frequency = frequency,
            Type = SignalGeneratorType.Sin
        };
        var click = new OffsetSampleProvider(signal)
        {
            Take = TimeSpan.FromMilliseconds(65)
        };

        output.Init(click);
        output.Play();
        await Task.Delay(80, cancellationToken);
        output.Stop();
    }
}
