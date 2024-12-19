import { ConnectionStoreItem } from "@/lib/conn-manager-store";
import { BrowserWindow } from "electron";
import { ConnectionPool } from "../connection-pool";
import path from "node:path";
import { Setting } from "../setting";
import { ThemeType } from "@/context/theme-provider";
import { STUDIO_ENDPOINT } from "../constants";

/**
 * Creates a new database window with the given connection details.
 * Optionally enables debugging features.
 *
 * @param win - The main BrowserWindow instance used to create the new window.
 * @param conn - The database connection details (ConnectionStoreItem).
 * @param enableDebug - Optional flag to enable debugging in the new window.
 *
 * @example
 * createDatabaseWindow(mainWindow, connectionData, true);
 */

export function createDatabaseWindow(ctx: {
  win: BrowserWindow | null;
  conn: ConnectionStoreItem;
  settings: Setting;
  __dirname: string;
  enableDebug?: boolean;
}) {
  const dbWindow = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    show: false,
    width: 1024,
    height: 768,
    autoHideMenuBar: true,
    webPreferences: {
      devTools: true,
      additionalArguments: ["--database=" + ctx.conn.id],
      preload: path.join(ctx.__dirname, "preload.mjs"),
    },
  });
  const theme = ctx.settings.get<ThemeType>("theme") || "light";

  ConnectionPool.create(ctx.conn);

  const queryString = new URLSearchParams({
    name: ctx.conn.name,
    theme,
  }).toString();

  dbWindow.on("closed", () => {
    ctx.win?.show();
    ConnectionPool.close(ctx.conn.id);
  });

  if (ctx.conn.type === "mysql") {
    dbWindow.loadURL(`${STUDIO_ENDPOINT}/mysql?${queryString}`);
  } else if (ctx.conn.type === "postgres") {
    dbWindow.loadURL(`${STUDIO_ENDPOINT}/postgres?${queryString}`);
  } else if (ctx.conn.type === "starbase" || ctx.conn.type === "cloudflare") {
    dbWindow.loadURL(`${STUDIO_ENDPOINT}/starbase?${queryString}`);
  } else {
    dbWindow.loadURL(`${STUDIO_ENDPOINT}/sqlite?${queryString}`);
  }

  if (process.env.NODE_ENV === "development" || ctx.enableDebug) {
    dbWindow.webContents.openDevTools();
    dbWindow.maximize();
  }

  dbWindow.show();
}
