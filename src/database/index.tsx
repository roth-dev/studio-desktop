import { Toolbar } from "@/components/toolbar";
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
  return (
    <div className="flex h-full w-full flex-col">
      <Toolbar>
        <AddConnectionDropdown />
      </Toolbar>
      <ConnectionList
        data={connectionList}
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
