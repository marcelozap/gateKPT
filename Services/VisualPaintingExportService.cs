using System;
using System.IO;
using System.Security;

namespace GateKPT.MusicOS.Services;

public sealed class VisualPaintingExportService
{
    public string ExportSvg(string libraryDirectory, VisualPaintingExport export)
    {
        var outputDirectory = Path.Combine(libraryDirectory, "visual-art");
        var path = AutoSaveFileNamer.CreatePath(outputDirectory, $"visual-painting-{export.Section}-{export.Instrument}", ".svg");
        var title = SecurityElement.Escape(export.Title);
        var mood = SecurityElement.Escape(export.Mood);
        var composition = SecurityElement.Escape(export.Composition);
        var palette = SecurityElement.Escape(export.Palette);
        var motion = SecurityElement.Escape(export.Motion);
        var signature = SecurityElement.Escape(export.Signature);
        var pulse = Math.Clamp(export.PulseSize, 80, 620);
        var bloom = Math.Clamp(export.BloomSize, 120, 760);
        var stroke = Math.Clamp(export.StrokeLevel, 0, 100);
        var intensity = Math.Clamp(export.Intensity, 0, 100);

        var svg = $$"""
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="bloom" cx="50%" cy="46%" r="55%">
      <stop offset="0%" stop-color="#E37B45" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="#6FB6A6" stop-opacity="0.24"/>
      <stop offset="100%" stop-color="#090806" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="room" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#15120D"/>
      <stop offset="38%" stop-color="#241A12"/>
      <stop offset="72%" stop-color="#10251F"/>
      <stop offset="100%" stop-color="#090806"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#room)"/>
  <circle cx="960" cy="510" r="{{bloom}}" fill="url(#bloom)"/>
  <circle cx="960" cy="510" r="{{pulse}}" fill="#6FB6A6" opacity="0.30"/>
  <circle cx="960" cy="510" r="89" fill="#F8F0E5" opacity="0.88"/>
  <g opacity="0.72">
    <rect x="300" y="{{920 - stroke * 4}}" width="90" height="{{80 + stroke * 4}}" rx="18" fill="#E37B45"/>
    <rect x="430" y="{{900 - intensity * 4}}" width="90" height="{{100 + intensity * 4}}" rx="18" fill="#EABF7A"/>
    <rect x="560" y="{{920 - export.InputLevel * 4}}" width="90" height="{{80 + export.InputLevel * 4}}" rx="18" fill="#6FB6A6"/>
    <rect x="1270" y="{{900 - stroke * 4}}" width="90" height="{{100 + stroke * 4}}" rx="18" fill="#D9C5A5"/>
    <rect x="1400" y="{{920 - intensity * 4}}" width="90" height="{{80 + intensity * 4}}" rx="18" fill="#9DBFB3"/>
    <rect x="1530" y="{{900 - export.InputLevel * 4}}" width="90" height="{{100 + export.InputLevel * 4}}" rx="18" fill="#F2EADC"/>
  </g>
  <text x="120" y="150" font-family="Georgia, serif" font-size="68" font-weight="700" fill="#F8F0E5">{{title}}</text>
  <text x="124" y="212" font-family="Consolas, monospace" font-size="28" fill="#E37B45">{{mood}}</text>
  <text x="124" y="884" font-family="Consolas, monospace" font-size="30" fill="#D9C5A5">{{composition}}</text>
  <text x="124" y="932" font-family="Consolas, monospace" font-size="24" fill="#9DBFB3">Palette: {{palette}} / Motion: {{motion}}</text>
  <text x="124" y="980" font-family="Consolas, monospace" font-size="22" fill="#8D7D68">{{signature}}</text>
</svg>
""";

        File.WriteAllText(path, svg);
        return path;
    }
}

public sealed record VisualPaintingExport(
    string Title,
    string Mood,
    string Composition,
    string Palette,
    string Motion,
    string Section,
    string Instrument,
    string Signature,
    double PulseSize,
    double BloomSize,
    double StrokeLevel,
    double Intensity,
    double InputLevel);
