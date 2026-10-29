"use client";

import { useSyncExternalStore } from "react";

const relativeTime = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

const formatRelative = (date: Date) => {
  const seconds = (date.getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return relativeTime.format(Math.round(seconds / size), unit);
    }
  }
  return "ahora";
};

const noop = () => () => {};

/** `false` en el servidor y al hidratar; `true` ya en el navegador. */
const useHydrated = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

// El texto depende del reloj y la fecha completa de la zona horaria, que no
// son iguales en el servidor y en el navegador: el HTML del servidor muestra
// su versión sin avisar del desajuste (error #418 de React) y, ya hidratado,
// el elemento se vuelve a montar con la hora y la zona del navegador.
export const RelativeTime = ({ date }: { date: Date }) => {
  const hydrated = useHydrated();
  return (
    <time
      key={hydrated ? "client" : "server"}
      dateTime={date.toISOString()}
      title={hydrated ? date.toLocaleString("es") : undefined}
      suppressHydrationWarning
    >
      {formatRelative(date)}
    </time>
  );
};
