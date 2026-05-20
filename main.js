const { app, BrowserWindow, screen, globalShortcut, ipcMain } = require("electron");
const path = require("path");

let mainWindow = null;

function createWindow() {
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  const external = displays.find((d) => d.id !== primary.id) || primary;

  mainWindow = new BrowserWindow({
    x: external.bounds.x,
    y: external.bounds.y,
    width: external.bounds.width,
    height: external.bounds.height,
    fullscreen: true,
    frame: false,
    backgroundColor: "#000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
  mainWindow.on("closed", () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();

  globalShortcut.register("Escape", () => {
    if (mainWindow) {
      if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
      } else {
        mainWindow.setFullScreen(true);
      }
    }
  });

  globalShortcut.register("F11", () => {
    if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen());
  });

  globalShortcut.register("CommandOrControl+Shift+H", () => {
    if (mainWindow) mainWindow.webContents.send("toggle-hud");
  });


  globalShortcut.register("CommandOrControl+Q", () => {
    app.quit();
  });

  ipcMain.handle("get-displays", () => {
    return screen.getAllDisplays().map((d) => ({
      id: d.id,
      label: d.label || `Display ${d.id}`,
      width: d.bounds.width,
      height: d.bounds.height,
      x: d.bounds.x,
      y: d.bounds.y,
      primary: d.id === screen.getPrimaryDisplay().id,
    }));
  });

  ipcMain.on("move-to-display", (_event, displayId) => {
    const target = screen.getAllDisplays().find((d) => d.id === displayId);
    if (target && mainWindow) {
      mainWindow.setBounds(target.bounds);
      mainWindow.setFullScreen(true);
    }
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  app.quit();
});
