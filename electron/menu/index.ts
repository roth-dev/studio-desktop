import { ConnectionStoreItem } from "@/lib/conn-manager-store";
import { app, Menu, MenuItemConstructorOptions, shell } from "electron";
import { isMac } from "../utils";
import { createDatabaseWindow, windowMap } from "../window/create-database";
import { OuterbaseApplication } from "../type";
import { createWindow } from "../main";
import { createConnectionWindow } from "../window/create-connection-window";
import { OUTERBASE_GITHUB, OUTERBASE_WEBSITE } from "../constants";

export function createMenu(
  win: OuterbaseApplication["win"],
  connections: ConnectionStoreItem[],
) {
  function handleClick() {
    createWindow();
  }

  function onOpenConnectionWindow(type: ConnectionStoreItem["type"]) {
    createConnectionWindow(win, type);
    win?.hide();
  }

  function generateSubMenu() {
    const connMenu: MenuItemConstructorOptions["submenu"] = connections.map(
      (conn) => {
        return {
          label: conn.name,
          click: () => {
            const existingWindow = windowMap.get(conn.id);
            if (existingWindow && !existingWindow.isDestroyed()) {
              existingWindow.focus();
            } else {
              createDatabaseWindow({ win, conn });
              win?.hide();
            }
          },
        };
      },
    );

    return connMenu;
  }

  const connSubMenu = generateSubMenu();

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
          label: "New Connection",
          submenu: [
            {
              label: "MySQL",
              click: () => onOpenConnectionWindow("mysql"),
            },
            {
              label: "PostgreSQL",
              click: () => onOpenConnectionWindow("postgres"),
            },
            {
              label: "SQLite",
              click: () => onOpenConnectionWindow("sqlite"),
            },
            {
              label: "Turso",
              click: () => onOpenConnectionWindow("turso"),
            },
            {
              label: "Cloudflare",
              click: () => onOpenConnectionWindow("cloudflare"),
            },
            {
              label: "Starbase",
              click: () => onOpenConnectionWindow("starbase"),
            },
          ],
        },
        {
          label: "New Window",
          click: handleClick,
        },
        {
          type: "separator",
        },
        {
          label: "Open Recent",
          enabled: connSubMenu.length > 0,
          submenu: connSubMenu,
          click: handleClick,
        },
        {
          type: "separator",
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
        ...(isMac
          ? [{ type: "separator" }, { role: "front" }]
          : [{ role: "close" }]),
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About Us",
          click: async () => {
            await shell.openExternal(OUTERBASE_WEBSITE);
          },
        },
        {
          label: "Report issues",
          click: async () => {
            await shell.openExternal(OUTERBASE_GITHUB);
          },
        },
      ],
    },
  ] as MenuItemConstructorOptions[];

  const menu = Menu.buildFromTemplate(customTemplate);
  Menu.setApplicationMenu(menu);
}
