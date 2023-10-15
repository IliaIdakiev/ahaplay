import { Server as HttpsServer } from "https";
import { Server as HttpServer } from "http";

export type HttpOrHttpsServer = HttpServer | HttpsServer;
