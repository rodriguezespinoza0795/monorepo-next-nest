import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { reportWarning } from "./report-error";

// Límite de frecuencia compartido por todas las instancias del servidor
// (Upstash Redis, ventana deslizante). Protege el tope mensual de
// publicaciones del plan gratuito de Stream, evita el spam de comentarios y
// el abuso de la búsqueda.
// Ver docs/reglas-de-negocio.md.
const redis = Redis.fromEnv();

const limiters = {
  post: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    prefix: "rl:post",
    timeout: 2000,
  }),
  comment: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "10 m"),
    prefix: "rl:comment",
    timeout: 2000,
  }),
  // Cada búsqueda son 2 consultas a Stream (posts y miembros).
  search: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "rl:search",
    timeout: 2000,
  }),
};

export type RateLimitKind = keyof typeof limiters;

/**
 * `true` si la acción está permitida. Si Upstash no responde, deja pasar
 * (mejor aceptar de más que bloquear a todos por una caída del servicio).
 */
export const takeRateLimit = async (kind: RateLimitKind, key: string) => {
  try {
    const { success, reason } = await limiters[kind].limit(key);
    if (reason === "timeout") {
      reportWarning("[rate-limit] Upstash tardó demasiado; se permite", {
        kind,
      });
    }
    return success;
  } catch (error) {
    reportWarning("[rate-limit] Upstash no respondió; se permite", {
      kind,
      error: String(error),
    });
    return true;
  }
};
