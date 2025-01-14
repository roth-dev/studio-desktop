import { Toolbar } from "@/components/toolbar";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { AnimatedRouter } from "@/components/animated-router";
import { ConnectionCreateUpdateRoute } from "./editor-route";
import { ConnectionStoreManager } from "@/lib/conn-manager-store";
import { useState } from "react";
import ImportConnectionStringRoute from "./import-connection-string";
import useNavigateToRoute from "@/hooks/useNavigateToRoute";
import AddConnectionDropdown from "./add-connection-dropdown";
import ConnectionList from "@/components/database/connection-list";

function ConnectionListRoute() {
  useNavigateToRoute();

  const [connectionList, setConnectionList] = useState(() => {
    return ConnectionStoreManager.list();
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) {
      return;
    }

    if (active?.id !== over?.id) {
      setConnectionList((items) => {
        const oldIndex = items.findIndex((item) => item.id === active?.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        const newList = arrayMove(items, oldIndex, newIndex);

        ConnectionStoreManager.saveAll(newList);
        return newList;
      });
    }
  }

  return (
    <div className="flex h-full w-full flex-col">
      <Toolbar>
        <AddConnectionDropdown />
      </Toolbar>
      <ConnectionList
        data={connectionList}
        onDragEnd={handleDragEnd}
        setConnectionList={setConnectionList}
      />
    </div>
  );
}

const ROUTE_LIST = [
  { path: "/connection", Component: ConnectionListRoute },
  { path: "/connection/import", Component: ImportConnectionStringRoute },
  { path: "/connection/create/:type", Component: ConnectionCreateUpdateRoute },
  {
    path: "/connection/edit/:type/:connectionId",
    Component: ConnectionCreateUpdateRoute,
  },
];

export default function DatabaseTab() {
  return <AnimatedRouter initialRoutes={["/connection"]} routes={ROUTE_LIST} />;
}
