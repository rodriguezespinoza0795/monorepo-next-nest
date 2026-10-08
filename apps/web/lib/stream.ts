import "server-only";
import { StreamClient } from "@stream-io/node-sdk";

export const stream = new StreamClient(
  process.env.NEXT_PUBLIC_STREAM_API_KEY as string,
  process.env.STREAM_API_SECRET as string,
);
