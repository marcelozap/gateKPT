using System;
using System.Collections.Generic;
using System.Linq;

namespace GateKPT.MusicOS.Services;

public sealed class CaptionDraftService
{
    public IReadOnlyList<CaptionLine> DraftFromLyrics(string lyrics, string tempoLabel, int beatsPerCaption)
    {
        var bpm = ParseBpm(tempoLabel);
        var safeBeats = Math.Clamp(beatsPerCaption, 2, 8);
        var secondsPerCaption = 60.0 / bpm * safeBeats;
        var lines = SplitLyrics(lyrics).ToArray();
        var captions = new List<CaptionLine>();

        for (var i = 0; i < lines.Length; i++)
        {
            var start = TimeSpan.FromSeconds(i * secondsPerCaption);
            var end = TimeSpan.FromSeconds((i + 1) * secondsPerCaption);
            var words = lines[i].Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
            var status = words > 9 || lines[i].Length > 64 ? "Needs review" : "Safe draft";
            var note = status == "Safe draft"
                ? $"{safeBeats}-beat caption pocket at {bpm:0} BPM."
                : "Line may be too dense. Better to leave it off or split manually than ship bad captions.";
            captions.Add(new CaptionLine(FormatTime(start), FormatTime(end), lines[i], status, note));
        }

        return captions;
    }

    public static string ToSrt(IEnumerable<CaptionLine> captions)
    {
        var lines = new List<string>();
        var index = 1;
        foreach (var caption in captions)
        {
            if (caption.Status != "Safe draft")
            {
                continue;
            }

            lines.Add(index.ToString());
            lines.Add($"{caption.Start.Replace('.', ',')} --> {caption.End.Replace('.', ',')}");
            lines.Add(caption.Text);
            lines.Add("");
            index++;
        }

        return string.Join(Environment.NewLine, lines);
    }

    private static IEnumerable<string> SplitLyrics(string lyrics)
    {
        return lyrics
            .Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries)
            .Select(line => line.Trim())
            .Where(line => line.Length > 0);
    }

    private static double ParseBpm(string tempoLabel)
    {
        var digits = new string(tempoLabel.Where(char.IsDigit).ToArray());
        return double.TryParse(digits, out var bpm) && bpm is >= 40 and <= 240 ? bpm : 120;
    }

    private static string FormatTime(TimeSpan time) =>
        $"{(int)time.TotalHours:00}:{time.Minutes:00}:{time.Seconds:00}.{time.Milliseconds:000}";
}
