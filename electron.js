import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const startUrl = process.env.ELECTRON_START_URL || `http://localhost:${PORT}`;

function checkServer(callback) {
  const req = http.get(startUrl, (res) => {
    callback(true);
  });
  req.on("error", () => {
    callback(false);
  });
  req.end();
}

function pollServer(mainWindow, retries = 30) {
  checkServer((isRunning) => {
    if (isRunning) {
      mainWindow.loadURL(startUrl);
    } else if (retries > 0) {
      setTimeout(() => pollServer(mainWindow, retries - 1), 1000);
    } else {
      mainWindow.loadURL(`data:text/html;charset=utf-8,<html><body style="font-family:Arial;padding:40px;background:#0f172a;color:#fff;"><h2>Erro ao iniciar o OS Manager</h2><p>O servidor local na porta ${PORT} não respondeu. Certifique-se de executar <b>pnpm dev</b> primeiro.</p></body></html>`);
    }
  });
}

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

  // Mostra uma tela de carregamento amigável enquanto o Vite/Backend sobe
  mainWindow.loadURL(`data:text/html;charset=utf-8,<html><body style="font-family:Arial;padding:40px;background:#0f172a;color:#fff;text-align:center;"><h2>Iniciando OS Manager...</h2><p>Aguardando o servidor local inicializar...</p></body></html>`);

  pollServer(mainWindow);
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
