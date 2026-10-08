import "server-only";
import { StreamClient } from "@stream-io/node-sdk";

// Cliente de Stream con el secreto de la app: solo en el servidor. Pasa por
// encima de los permisos de Stream, así que quien lo use valida antes.
export const stream = new StreamClient(
  process.env.NEXT_PUBLIC_STREAM_API_KEY as string,
  process.env.STREAM_API_SECRET as string,
);
