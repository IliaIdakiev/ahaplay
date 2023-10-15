import { Server } from "socket.io";
import { HttpOrHttpsServer } from "./types/server";

export function init(server: HttpOrHttpsServer) {
  const io = new Server(server);
}
