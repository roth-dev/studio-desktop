import { BrowserWindow } from "electron";
import { getWindowConfig } from "../utils";
import path from "node:path";
import { RENDERER_DIST, VITE_DEV_SERVER_URL } from "../main";
import { ConnectionStoreItem } from "@/lib/conn-manager-store";
import { OuterbaseApplication } from "electron/type";

export function createConnectionWindow(
  win: OuterbaseApplication["win"],
  type: ConnectionStoreItem["type"],
) {
  const newWin = new BrowserWindow(getWindowConfig());
  const route = "connection/create/" + type;

  if (VITE_DEV_SERVER_URL) {
    const url = `${VITE_DEV_SERVER_URL}${route}`;
    newWin.loadURL(url);
  } else {
    // win.loadFile('dist/index.html')
    const filePath = path.join(RENDERER_DIST, "index.html");
    newWin.loadFile(filePath, {
      hash: `#/${route}`,
    });
  }

  newWin.show();

  newWin.on("closed", () => {
    if (BrowserWindow.getAllWindows().length === 1) {
      win?.show();
    }
    newWin.destroy();
  });
}
