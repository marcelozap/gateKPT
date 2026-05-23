using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using GateKPT.MusicOS.ViewModels;

namespace GateKPT.MusicOS.Services;

public sealed class LocalLibraryStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
    };

    public string LibraryDirectory { get; } = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "GateKPT",
        "MusicOS");

    private string CapturesPath => Path.Combine(LibraryDirectory, "captures.json");

    public IReadOnlyList<CaptureItem> LoadCaptures()
    {
        try
        {
            if (!File.Exists(CapturesPath))
            {
                return [];
            }

            var json = File.ReadAllText(CapturesPath);
            return JsonSerializer.Deserialize<List<CaptureItem>>(json, JsonOptions) ?? [];
        }
        catch
        {
            return [];
        }
    }

    public void SaveCaptures(IEnumerable<CaptureItem> captures)
    {
        Directory.CreateDirectory(LibraryDirectory);
        var json = JsonSerializer.Serialize(captures, JsonOptions);
        File.WriteAllText(CapturesPath, json);
    }
}
