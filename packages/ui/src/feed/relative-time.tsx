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

export const RelativeTime = ({ date }: { date: Date }) => (
  <time dateTime={date.toISOString()} title={date.toLocaleString("es")}>
    {formatRelative(date)}
  </time>
);
