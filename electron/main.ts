import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  type OpenDialogOptions,
} from "electron";
import path from "node:path";
import { ConnectionPool } from "./connection-pool";
import electronUpdater, { type AppUpdater } from "electron-updater";
import log from "electron-log";
import { type ConnectionStoreItem } from "@/lib/conn-manager-store";
import { bindDockerIpc } from "./ipc/docker";
import { Setting } from "./setting";
import { OuterbaseApplication } from "./type";
import { createMenu } from "./menu";
import { createDatabaseWindow } from "./window/create-database";
import { getOuterbaseDir, isDev, isMac } from "./utils";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const require = createRequire(import.meta.url);

export function getAutoUpdater(): AppUpdater {
  // Using destructuring to access autoUpdater due to the CommonJS module of 'electron-updater'.
  // It is a workaround for ESM compatibility issues, see https://github.com/electron-userland/electron-builder/issues/7976.
  const { autoUpdater } = electronUpdater;
  return autoUpdater;
}
const autoUpdater = getAutoUpdater();
log.transports.file.level = "info";
autoUpdater.logger = log;
autoUpdater.autoDownload = false;

const __dirname = getOuterbaseDir();

// The built directory structure
//

// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

const settings = new Setting();
settings.load();
const application: OuterbaseApplication = {
  win: undefined,
};

export function createWindow() {
  application.win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    title: "Outerbase Studio",

    autoHideMenuBar: true,
    webPreferences: {
      devTools: true,
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  if (isDev) {
    application.win.webContents.openDevTools({ mode: "detach" });
  }

  // Test active push message to Renderer-process.
  application.win.webContents.on("did-finish-load", () => {
    application.win?.webContents.send(
      "main-process-message",
      new Date().toLocaleString(),
    );
  });

  application.win.webContents.on("will-navigate", (event, url) => {
    console.log("trying to navigate", url);
    event.preventDefault();
  });

  application.win.webContents.on("will-redirect", (event, url) => {
    log.info("trying to redirect", url);
    event.preventDefault();
  });

  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on("checking-for-update", () => {
    application.win?.webContents.send("checking-for-update");
    log.info("checking-for-update");
  });

  autoUpdater.on("update-available", (info) => {
    application.win?.webContents.send("update-available", info);
    log.info("update-available", info);
  });

  autoUpdater.on("update-not-available", (info) => {
    application.win?.webContents.send("update-not-available", info);
    log.info("update-not-available", info);
  });

  autoUpdater.on("error", (info) => {
    application.win?.webContents.send("update-error", info);
    log.info("error", info);
  });

  autoUpdater.on("download-progress", (progress) => {
    application.win?.webContents.send("update-download-progress", progress);
    log.info("download-progress", progress);
  });

  autoUpdater.on("update-downloaded", (info) => {
    application.win?.webContents.send("update-downloaded", info);
    log.info("update-downloaded", info);
  });

  if (VITE_DEV_SERVER_URL) {
    application.win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    application.win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
    application.win = undefined;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app
  .whenReady()
  .then(createWindow)
  .finally(() => {
    bindDockerIpc(application);
  });

ipcMain.on("connections", (_, connections: ConnectionStoreItem[]) => {
  createMenu(application.win, connections);
});

ipcMain.handle("query", async (_, connectionId, query) => {
  const r = await ConnectionPool.query(connectionId, query);
  return r;
});

ipcMain.handle(
  "transaction",
  async (_, connectionId: string, query: string[]) => {
    return await ConnectionPool.batch(connectionId, query);
  },
);

ipcMain.handle("close", async (sender) => {
  sender.sender.close({
    waitForBeforeUnload: true,
  });

  if (BrowserWindow.getAllWindows().length > 1) {
    application.win?.destroy();
  }
});

ipcMain.handle("connect", (_, conn: ConnectionStoreItem, enableDebug) => {
  createDatabaseWindow({
    win: application.win,
    conn,
    enableDebug,
  });
  if (application.win) application.win.hide();
});

ipcMain.handle("test-connection", async (_, conn: ConnectionStoreItem) => {
  return await ConnectionPool.testConnection(conn);
});

ipcMain.handle("download-update", () => {
  autoUpdater.downloadUpdate();
});

ipcMain.handle("restart", () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle("open-file-dialog", async (_, options: OpenDialogOptions) => {
  return await dialog.showOpenDialog(options);
});

ipcMain.handle("get-setting", (_, key) => {
  return settings.get(key);
});

ipcMain.handle("set-setting", (_, key, value) => {
  settings.set(key, value);
});
