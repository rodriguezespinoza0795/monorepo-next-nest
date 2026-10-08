import "server-only";

// Límite de frecuencia en memoria (ventana deslizante por clave). Protege el
// tope mensual de actividades del plan gratuito de Stream. Vive en el proceso:
// con varias instancias del servidor cada una lleva su propia cuenta.
const hits = new Map<string, number[]>();

export const takeRateLimit = (key: string, limit: number, windowMs: number) => {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
};
