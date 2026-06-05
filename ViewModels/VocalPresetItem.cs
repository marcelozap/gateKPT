using GateKPT.MusicOS.Services;

namespace GateKPT.MusicOS.ViewModels;

public sealed record VocalPresetItem(
    string Name,
    string Slug,
    string Description,
    AudioEditPreset AudioPreset)
{
    public override string ToString() => Name;
}
