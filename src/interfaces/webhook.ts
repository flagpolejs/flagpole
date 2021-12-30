import { Server } from "minikin";
import { ServerOptions } from "https";

export interface WebhookServer {
  port: number;
  opts: ServerOptions;
  server: Server;
}
