"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Último recurso: un error que rompe el layout raíz. Se envía a Sentry y se
// muestra una página mínima (sin el tema, que también pudo fallar).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#04060E",
          color: "#E0E7FF",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Algo salió mal</h1>
          <p style={{ opacity: 0.8, marginBottom: 24 }}>
            Ya registramos el error. Intenta de nuevo en un momento.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: "#fff",
              border: 0,
              borderRadius: 10,
              padding: "12px 24px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
