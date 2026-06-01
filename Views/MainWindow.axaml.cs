using Avalonia.Controls;
using Avalonia.Interactivity;
using Avalonia.Platform.Storage;
using Avalonia.Threading;
using GateKPT.MusicOS.ViewModels;

namespace GateKPT.MusicOS.Views;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        Opened += (_, _) =>
        {
            Dispatcher.UIThread.Post(() => MainWorkspaceScroll.Offset = default);
        };
    }

    private async void BrowseVideo_Click(object? sender, RoutedEventArgs e)
    {
        if (DataContext is not MainWindowViewModel vm)
        {
            return;
        }

        var files = await StorageProvider.OpenFilePickerAsync(new FilePickerOpenOptions
        {
            Title = "Choose camera video or reference audio",
            AllowMultiple = false,
            FileTypeFilter =
            [
                new FilePickerFileType("Video and audio")
                {
                    Patterns = ["*.mp4", "*.mov", "*.mkv", "*.avi", "*.wav", "*.mp3", "*.m4a", "*.flac"],
                },
                FilePickerFileTypes.All,
            ],
        });

        if (files.Count > 0 && files[0].Path.LocalPath is { Length: > 0 } path)
        {
            vm.VideoPath = path;
        }
    }

    private async void BrowseVocal_Click(object? sender, RoutedEventArgs e)
    {
        if (DataContext is not MainWindowViewModel vm)
        {
            return;
        }

        var files = await StorageProvider.OpenFilePickerAsync(new FilePickerOpenOptions
        {
            Title = "Choose final vocal or mixed audio",
            AllowMultiple = false,
            FileTypeFilter =
            [
                new FilePickerFileType("Audio")
                {
                    Patterns = ["*.wav", "*.mp3", "*.m4a", "*.aiff", "*.aif", "*.flac", "*.wma"],
                },
                FilePickerFileTypes.All,
            ],
        });

        if (files.Count > 0 && files[0].Path.LocalPath is { Length: > 0 } path)
        {
            vm.VocalPath = path;
        }
    }
}
