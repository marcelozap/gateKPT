using System;
using System.Collections.Generic;
using System.IO;
using NAudio.Wave;

namespace GateKPT.MusicOS.Services;

public sealed class BuiltInLooperPlaybackService : IDisposable
{
    private readonly Dictionary<int, PlaybackHandle> _playing = [];

    public LooperPlaybackResult PlayLoop(int trackNumber, string path, double volume)
    {
        Stop(trackNumber);

        try
        {
            if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
            {
                return new LooperPlaybackResult(false, $"Track {trackNumber} has no recorded stem yet.");
            }

            var reader = new AudioFileReader(path)
            {
                Volume = (float)Math.Clamp(volume / 100.0, 0, 1)
            };
            var loop = new LoopStream(reader);
            var output = new WaveOutEvent();
            output.Init(loop);
            output.Play();
            _playing[trackNumber] = new PlaybackHandle(reader, loop, output);
            return new LooperPlaybackResult(true, $"Looping track {trackNumber}: {Path.GetFileName(path)}");
        }
        catch (Exception ex)
        {
            Stop(trackNumber);
            return new LooperPlaybackResult(false, $"Could not play track {trackNumber}: {ex.Message}");
        }
    }

    public void Stop(int trackNumber)
    {
        if (!_playing.Remove(trackNumber, out var handle))
        {
            return;
        }

        handle.Dispose();
    }

    public bool SetVolume(int trackNumber, double volume)
    {
        if (!_playing.TryGetValue(trackNumber, out var handle))
        {
            return false;
        }

        handle.SetVolume(volume);
        return true;
    }

    public void StopAll()
    {
        foreach (var trackNumber in _playing.Keys)
        {
            Stop(trackNumber);
        }
    }

    public void Dispose() => StopAll();

    private sealed class PlaybackHandle(AudioFileReader reader, LoopStream loop, WaveOutEvent output) : IDisposable
    {
        public void SetVolume(double volume)
        {
            reader.Volume = (float)Math.Clamp(volume / 100.0, 0, 1);
        }

        public void Dispose()
        {
            output.Stop();
            output.Dispose();
            loop.Dispose();
            reader.Dispose();
        }
    }
}

public sealed record LooperPlaybackResult(bool Success, string Message);

internal sealed class LoopStream(WaveStream sourceStream) : WaveStream
{
    public override WaveFormat WaveFormat => sourceStream.WaveFormat;

    public override long Length => sourceStream.Length;

    public override long Position
    {
        get => sourceStream.Position;
        set => sourceStream.Position = value;
    }

    public override int Read(byte[] buffer, int offset, int count)
    {
        var totalBytesRead = 0;

        while (totalBytesRead < count)
        {
            var bytesRead = sourceStream.Read(buffer, offset + totalBytesRead, count - totalBytesRead);
            if (bytesRead == 0)
            {
                if (sourceStream.Position == 0)
                {
                    break;
                }

                sourceStream.Position = 0;
            }

            totalBytesRead += bytesRead;
        }

        return totalBytesRead;
    }
}
