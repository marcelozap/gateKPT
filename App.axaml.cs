using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Data.Core;
using Avalonia.Data.Core.Plugins;
using System.Linq;
using Avalonia.Markup.Xaml;
using GateKPT.MusicOS.ViewModels;
using GateKPT.MusicOS.Views;

namespace GateKPT.MusicOS;

public partial class App : Application
{
    public override void Initialize()
    {
        AvaloniaXamlLoader.Load(this);
    }

    public override void OnFrameworkInitializationCompleted()
    {
        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            var fullOsMode = desktop.Args?.Any(arg =>
                arg.Equals("--full-os", System.StringComparison.OrdinalIgnoreCase)) == true;

            desktop.MainWindow = fullOsMode
                ? new MainWindow
                {
                    DataContext = new MainWindowViewModel(),
                }
                : new RecorderWindow
                {
                    DataContext = new RecorderWindowViewModel(),
                };
        }

        base.OnFrameworkInitializationCompleted();
    }
}
