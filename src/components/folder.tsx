import { FolderIcon } from "lucide-react";
import { Button } from "./ui/button";
import React, { useMemo, useState } from "react";
import { ConnectionStoreItem } from "@/lib/conn-manager-store";
import { Input } from "./ui/input";

interface Props {
  data: ConnectionStoreItem[];
  renderItem: (data: ConnectionStoreItem[]) => React.ReactElement;
}

interface Folder {
  title: string;
  data: ConnectionStoreItem[];
}

const connectionTypeList = [
  "mysql",
  "postgres",
  "sqlite",
  "turso",
  "cloudflare",
  "starbase",
];
export default function Folder({ data, renderItem }: Props) {
  const [activeType, setActiveType] = useState("mysql");

  const filterConnections = useMemo(() => {
    return data.filter((item) => item.type === activeType);
  }, [data, activeType]);

  return (
    <div className="bg-red flex h-full flex-1 flex-row gap-3">
      <div className="w-48 pl-3">
        {/* <CreateFolderButton /> */}
        <div className="mb-3 mt-3">
          <Input placeholder="Search..." />
        </div>
        {connectionTypeList.map((conn, index) => {
          const active = conn === activeType;
          return (
            <Button
              onClick={() => setActiveType(conn)}
              key={index}
              variant="ghost"
              className={`flex ${active ? "bg-neutral-800" : ""} w-full justify-start gap-3 p-2`}
            >
              <FolderIcon size={14} />
              <span className="text-sm capitalize">{conn}</span>
            </Button>
          );
        })}
      </div>
      <div className="flex-1 border-l">{renderItem(filterConnections)}</div>
    </div>
  );
}
