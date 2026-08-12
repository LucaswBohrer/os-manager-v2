const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "OS Manager - Sistema Profissional de Ordens de Serviço",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Em produção local, carrega o servidor local embutido ou URL de desenvolvimento
  const startUrl = process.env.ELECTRON_START_URL || "http://localhost:3000";
  mainWindow.loadURL(startUrl);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
