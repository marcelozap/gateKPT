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
            var recorderMode = desktop.Args?.Any(arg =>
                arg.Equals("--recorder", System.StringComparison.OrdinalIgnoreCase)) == true;

            desktop.MainWindow = recorderMode
                ? new RecorderWindow
                {
                    DataContext = new RecorderWindowViewModel(),
                }
                : new MainWindow
                {
                    DataContext = new MainWindowViewModel(),
                };
        }

        base.OnFrameworkInitializationCompleted();
    }
}
