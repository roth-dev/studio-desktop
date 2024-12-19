import { ConnectionStoreItem } from "@/lib/conn-manager-store";
import { createWindow } from "../main";
import { isMac } from "../utils";
import {
  app,
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
  shell,
} from "electron";
import { Setting } from "../setting";
import { createDatabaseWindow } from "../window/create-database";
import path from "path";
export function createMenu(ctx: { settings: Setting; __dirname: string }) {
  function handleOpenDatabaseWidnow(conn: ConnectionStoreItem) {
    createDatabaseWindow({
      win: BrowserWindow.getFocusedWindow(),
      conn,
      settings: ctx.settings,
      __dirname: ctx.__dirname,
    });
  }
  function handleClick(win?: BrowserWindow) {
    createWindow();
  }

  const customTemplate = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "New",
          click: () => {
            console.log("New Window clicked");
            // Add your logic for opening a new window
          },
          submenu: [
            {
              label: "MySQL",
              click: () => {
                const conn: ConnectionStoreItem = {
                  id: "mysql-" + crypto.randomUUID(),
                  name: "MySQL Local",
                  type: "mysql",
                  config: {
                    host: "localhost",
                    port: "3306",
                    username: "root",
                    password: "123456",
                    database: "test",
                  },
                };
                handleOpenDatabaseWidnow(conn);
              },
            },
            {
              label: "PostgreSQL",
              click: () => {
                console.log("add myqsl");
              },
            },
            {
              label: "SQLite",
              icon: "",
              click: () => {
                console.log("add myqsl");
              },
            },
            {
              label: "Turso",
              click: () => {
                console.log("add myqsl");
              },
            },
            {
              label: "Cloudflare",
              click: () => {
                console.log("add myqsl");
              },
            },
            {
              label: "Starbase",
              // icon: path.join(ctx.__dirname, "icons", "starbase.png"),
              click: () => {
                console.log("add myqsl");
              },
            },
          ],
        },
        {
          label: "New Window",
          click: (_, win) => {
            handleClick(win);
          },
        },
        {
          label: "Toggle Dark Mode",
          click: () => {
            console.log("New Window clicked");
            // const newWindow = win.on("")
            // Add your logic for opening a new window
          },
        },
        { role: "close" },
        ...(isMac ? [] : [{ label: "Exit", role: "quit" }]),
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "delete" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        // ...(process.platform === "darwin"
        //   ? [{ type: "separator" }, { role: "front" }]
        //   : [{ role: "close" }]),
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About Us",
          click: async () => {
            await shell.openExternal("https://outerbase.com");
          },
        },
        {
          label: "Report issues",
          click: async () => {
            await shell.openExternal(
              "https://github.com/outerbase/studio-desktop/issues",
            );
          },
        },
      ],
    },
  ] as MenuItemConstructorOptions[];

  const menu = Menu.buildFromTemplate(customTemplate);
  Menu.setApplicationMenu(menu);
}
