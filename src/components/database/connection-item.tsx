import { useState } from "react";
import {
  ConnectionStoreItem,
  ConnectionStoreManager,
  connectionTypeTemplates,
} from "@/lib/conn-manager-store";
import { useSortable } from "@dnd-kit/sortable";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { MySQLIcon } from "@/lib/outerbase-icon";
import { Button } from "../ui/button";
import {
  LucideCopy,
  LucideMoreHorizontal,
  LucidePencil,
  LucideTrash,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { motion } from "framer-motion";
import { CSS } from "@dnd-kit/utilities";
import { generateConnectionString } from "@/lib/connection-string";
import { cn } from "@/lib/utils";
import { DispatchState } from "./type";
import useTimeAgo from "@/hooks/useTimeAgo";
export default function ConnectionItem({
  item,
  selectedConnection,
  setSelectedConnection,
  setConnectionList,
  setDeletingConnectionId,
}: {
  item: ConnectionStoreItem;
  selectedConnection?: string;
  setSelectedConnection: DispatchState<string>;
  setConnectionList: DispatchState<ConnectionStoreItem[]>;
  setDeletingConnectionId: DispatchState<ConnectionStoreItem | null>;
}) {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const { timeAgo } = useTimeAgo();

  const { toast } = useToast();
  const navigate = useNavigate();
  const typeConfig = connectionTypeTemplates[item.type];
  const IconComponent = typeConfig?.icon ?? MySQLIcon;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function onConnect(debuggerMode = false) {
    window.outerbaseIpc
      .connect(item, debuggerMode)
      .then(() => {
        ConnectionStoreManager.save({ ...item, lastConnectedAt: Date.now() });
      })
      .finally(() => {
        setConnectionList(ConnectionStoreManager.list());
      });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(!isMenuOpen && listeners)}
      onMouseDown={() => {
        setSelectedConnection(item.id);
      }}
      onDoubleClick={() => onConnect()}
    >
      <motion.div
        initial={{ transform: "translateX(100%)" }}
        animate={{ transform: "translateX(0)" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        exit={{ transform: "translateX(100%)" }}
        key={item.id}
        className={cn(
          "h-32 cursor-pointer gap-4 rounded-lg border p-3 hover:bg-gray-100 dark:hover:bg-neutral-800",
          selectedConnection === item.id
            ? "bg-gray-100 dark:bg-neutral-900"
            : "bg-background",
        )}
      >
        <div className="flex flex-1 gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-gray-200 dark:bg-neutral-800">
            <IconComponent className="h-8 w-8" />
          </div>
          <div className="flex flex-1 flex-col gap-1 text-sm">
            <div className="line-clamp-1 font-semibold">{item.name}</div>
            <div className="font-mono capitalize text-neutral-600">
              {item.type}
            </div>
          </div>
          <div>
            <DropdownMenu
              modal={false}
              open={isMenuOpen}
              onOpenChange={setMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button variant={"ghost"} size={"icon"}>
                  <LucideMoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem inset onClick={() => onConnect()}>
                  Connect
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    navigate(`/connection/edit/${item.type}/${item.id}`);
                  }}
                >
                  <LucidePencil className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setConnectionList(ConnectionStoreManager.duplicate(item));
                  }}
                  inset
                >
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => {
                    window.navigator.clipboard.writeText(
                      generateConnectionString(item, false),
                    );
                    toast({
                      title: "Connection string copied to clipboard",
                      duration: 1000,
                    });
                  }}
                >
                  <LucideCopy className="h-4 w-4" />
                  Copy Connection String
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setDeletingConnectionId(item);
                  }}
                >
                  <LucideTrash className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="absolute bottom-3 text-sm text-neutral-600">
          Last connected{" "}
          {item?.lastConnectedAt
            ? timeAgo(item?.lastConnectedAt, true)
            : "Unknown"}
        </div>
      </motion.div>
    </div>
  );
}
