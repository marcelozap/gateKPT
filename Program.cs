using System;
using Avalonia;
using GateKPT.MusicOS.Services;

namespace GateKPT.MusicOS;

sealed class Program
{
    // Initialization code. Don't use any Avalonia, third-party APIs or any
    // SynchronizationContext-reliant code before AppMain is called: things aren't initialized
    // yet and stuff might break.
    [STAThread]
    public static void Main(string[] args)
    {
        if (Array.Exists(args, arg => arg.Equals("--self-test", StringComparison.OrdinalIgnoreCase)))
        {
            Environment.ExitCode = new BackendSelfTestService().Run(Console.Out);
            return;
        }

        if (Array.Exists(args, arg => arg.Equals("--audio-probe", StringComparison.OrdinalIgnoreCase)))
        {
            Environment.ExitCode = new AudioProbeCliService().Run(Console.Out);
            return;
        }

        if (Array.Exists(args, arg => arg.Equals("--recording-smoke-test", StringComparison.OrdinalIgnoreCase)))
        {
            Environment.ExitCode = new RecordingSmokeTestCliService().Run(Console.Out);
            return;
        }

        BuildAvaloniaApp()
            .StartWithClassicDesktopLifetime(args);
    }

    // Avalonia configuration, don't remove; also used by visual designer.
    public static AppBuilder BuildAvaloniaApp()
        => AppBuilder.Configure<App>()
            .UsePlatformDetect()
#if DEBUG
            .WithDeveloperTools()
#endif
            .WithInterFont()
            .LogToTrace();
}
