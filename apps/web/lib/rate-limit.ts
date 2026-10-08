import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Límite de frecuencia compartido por todas las instancias del servidor
// (Upstash Redis, ventana deslizante). Protege el tope mensual de
// publicaciones del plan gratuito de Stream y evita el spam de comentarios.
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
      console.warn(`[rate-limit] Upstash tardó demasiado (${kind}); se permite`);
    }
    return success;
  } catch (error) {
    console.error("[rate-limit] Upstash no respondió; se permite", error);
    return true;
  }
};
