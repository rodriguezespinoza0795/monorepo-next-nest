"use client";

import type { ReactNode } from "react";
import { useFeedsClient } from "@stream-io/feeds-react-sdk";

// Los hooks de estado del SDK (`useStateStore`, `useClientConnectedUser`, …)
// no se pueden renderizar en el servidor ("Missing getServerSnapshot") y no
// tienen datos hasta que el cliente conecta. Los componentes que los usan se
// envuelven aquí: muestran `fallback` hasta que hay cliente.
export const RequireFeedsClient = ({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) => (useFeedsClient() ? children : fallback);
