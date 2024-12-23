import { ThemeType } from "@/context/theme-provider";
import { ConnectionStoreItem } from "@/lib/conn-manager-store";
import { BrowserWindow } from "electron";
import { ConnectionPool } from "../connection-pool";
import { STUDIO_ENDPOINT } from "../constants";
import { Setting } from "../setting";
import { OuterbaseApplication } from "../type";
import { getWindowConfig, isDev } from "../utils";

export const windowMap = new Map<string, BrowserWindow>();

export function createDatabaseWindow(ctx: {
  win: OuterbaseApplication["win"];
  conn: ConnectionStoreItem;
  enableDebug?: boolean;
}) {
  const dbWindow = new BrowserWindow(getWindowConfig(ctx.conn.id));

  const settings = new Setting();
  settings.load();
  const theme = settings.get<ThemeType>("theme") || "light";

  ConnectionPool.create(ctx.conn);

  const queryString = new URLSearchParams({
    name: ctx.conn.name,
    theme,
  }).toString();

  windowMap.set(ctx.conn.id, dbWindow);

  dbWindow.on("closed", () => {
    if (windowMap.size === 1) {
      ctx.win?.show();
    }
    windowMap.delete(ctx.conn.id);
    ConnectionPool.close(ctx.conn.id);
    dbWindow.destroy();
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

  if (isDev || ctx.enableDebug) {
    dbWindow.webContents.openDevTools();
    dbWindow.maximize();
  }

  dbWindow.show();
}
