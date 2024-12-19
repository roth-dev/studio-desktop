import { BrowserWindow, ipcMain, shell } from "electron";
import fs from "fs";
import Docker, { ContainerInspectInfo } from "dockerode";
import { getUserDataPath } from "./../file-helper";
import { type DatabaseInstanceStoreItem } from "@/lib/db-manager-store";

export interface PullImageProgress {
  status: string;
  progressDetail: { current: number; total: number };
  progress: string;
  id: string;
}
let hadnlerBound = false;
export function bindDockerIpc(win: BrowserWindow) {
  if (hadnlerBound) return;
  hadnlerBound = true;
  const docker = new Docker();
  let eventStream: NodeJS.ReadableStream | undefined;

  async function getContainer(
    id: string,
  ): Promise<ContainerInspectInfo | undefined> {
    return await new Promise((resolve) => {
      docker.getContainer(id).inspect((err, data) => {
        if (err) resolve(undefined);
        resolve(data);
      });
    });
  }

  async function startContainer(id: string) {
    console.log("starting", id);
    return await new Promise((resolve, reject) => {
      docker.getContainer(id).start((err) => {
        if (err) reject(err);
        resolve(true);
      });
    });
  }

  async function removeContainer(id: string) {
    return await new Promise((resolve, reject) => {
      docker.getContainer(id).remove((err) => {
        if (err) reject(err);

        const volume = getUserDataPath(`vol/${id}`);
        if (fs.existsSync(volume)) {
          fs.rmdirSync(volume, { recursive: true });
        }

        resolve(true);
      });
    });
  }

  async function pullImage(
    data: DatabaseInstanceStoreItem,
    progressCallback: (event: PullImageProgress) => void,
  ) {
    console.log("pulling", data);
    return await new Promise((resolve, reject) => {
      docker.pull(`${data.type}:${data.version}`, {}, (err, stream) => {
        if (err) reject(err);

        if (!stream) {
          reject(new Error("Stream is not available"));
          return;
        }

        docker.modem.followProgress(
          stream,
          (err) => {
            if (err) reject(err);
            resolve(true);
          },
          progressCallback,
        );
      });
    });
  }

  let dockerIniting = false;
  ipcMain.handle("docker-init", async () => {
    try {
      if (dockerIniting) return false;
      if (eventStream) return true;

      dockerIniting = true;

      eventStream = await docker.getEvents();

      eventStream.on("data", (data) => {
        win.webContents.send("docker-event", data.toString());
      });

      eventStream.on("end", () => {
        eventStream = undefined;
      });

      dockerIniting = false;

      return true;
    } catch (e) {
      console.error(e);
      dockerIniting = false;
      return false;
    }
  });

  ipcMain.handle("docker-open-vol", (_, id: string) => {
    shell.openPath(getUserDataPath(`vol/${id}`));
  });

  ipcMain.handle(
    "docker-create",
    async (_, data: DatabaseInstanceStoreItem) => {
      if (data.type === "mysql") {
        // Get the volume path
        const volume = getUserDataPath(`/vol/${data.id}`);
        console.log("here", volume);

        await docker.createContainer({
          name: data.id,
          Image: `mysql:${data.version}`,
          Env: [
            data.config.username !== "root"
              ? `MYSQL_USER=${data.config.username}`
              : "",
            `MYSQL_PASSWORD=${data.config.username}`,
            `MYSQL_ROOT_PASSWORD=${data.config.password}`,
          ].filter(Boolean),
          ExposedPorts: { "3306/tcp": {} },
          HostConfig: {
            PortBindings: { "3306/tcp": [{ HostPort: `${data.config.port}` }] },
            Binds: [`${volume}:/var/lib/mysql`],
          },
        });
      } else {
        const volume = getUserDataPath(`vol/${data.id}`);

        await docker.createContainer({
          name: data.id,
          Image: `postgres:${data.version}`,
          Env: [
            `POSTGRES_PASSWORD=${data.config.password}`,
            `POSTGRES_USER=${data.config.username}`,
          ],
          ExposedPorts: { "5432/tcp": {} },
          HostConfig: {
            PortBindings: { "5432/tcp": [{ HostPort: `${data.config.port}` }] },
            Binds: [`${volume}:/var/lib/postgresql/data`],
          },
        });
      }
    },
  );

  ipcMain.handle("docker-list", async () => {
    return await new Promise((resolve, reject) => {
      docker.listContainers(
        {
          all: true,
        },
        (err, containers) => {
          if (err) reject(err);
          resolve(containers ?? []);
        },
      );
    });
  });

  ipcMain.handle("docker-stop", async (_, containerId: string) => {
    return await new Promise((resolve, reject) => {
      docker.getContainer(containerId).stop((err) => {
        if (err) reject(err);
        resolve(true);
      });
    });
  });

  ipcMain.handle("docker-inspect", async (_, containerId: string) => {
    return await getContainer(containerId);
  });

  ipcMain.handle("docker-start", async (_, containerId: string) => {
    return await startContainer(containerId);
  });

  ipcMain.handle("docker-remove", async (_, containerId: string) => {
    return await removeContainer(containerId);
  });

  ipcMain.handle(
    "docker-pull",
    async (sender, data: DatabaseInstanceStoreItem) => {
      return await pullImage(data, (event) => {
        sender.sender.send("docker-pull-progress", {
          containerId: data.id,
          progress: event,
        });
      });
    },
  );
}
