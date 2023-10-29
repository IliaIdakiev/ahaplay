import { Store } from "redux";
import { Server, Socket } from "socket.io";
import { HttpOrHttpsServer } from "../types/server";
import { AuthenticationData, SessionConnections } from "./types";
import { verifyToken } from "../modules/jwt";
import { AuthJwtPayload } from "../api/interfaces";
import { createWorkshopHandlersForSocket } from "./handlers";
import { AuthSocketServerEvents, AuthSocketClientEvents } from "./event-names";
import { ProfileModelInstance } from "../database";
import { QuizSessionState } from "../workshops/quiz/store";
import { QuizActions } from "../workshops/quiz/actions";

export function init(server: HttpOrHttpsServer) {
  const io = new Server(server);
  const connections = new Map<string, Socket>();
  const authenticatedConnections = new Map<
    string,
    { socket: Socket; profile: ProfileModelInstance }
  >();
  const workshopSessions = new Map<
    string,
    {
      readonly connections: SessionConnections;
      readonly store: Store<QuizSessionState, QuizActions>;
    }
  >();

  io.on("connection", (socket) => {
    connections.set(socket.id, socket);
    io.on(AuthSocketServerEvents.Authenticate, (data: AuthenticationData) => {
      verifyToken<AuthJwtPayload>(data.token)
        .then((authPayload) => {
          const handlers = createWorkshopHandlersForSocket(socket, {
            authenticatedConnections,
            workshopSessions,
            authPayload,
          });

          for (const [handlerName, handler] of Object.entries(handlers)) {
            socket.on(handlerName, handler);
          }
        })
        .catch((err) => {
          console.error(err);
          socket.send(AuthSocketClientEvents.AuthenticateError, {
            token: data.token,
            err,
          });
          socket.disconnect();
        });
    });
  });
}
