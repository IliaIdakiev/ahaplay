import { Store } from "redux";
import { Socket } from "socket.io";
import { AuthJwtPayload } from "../api/interfaces";
import { ProfileModelInstance } from "../database";
import { QuizActions } from "../workshops/quiz/actions";
import { QuizSessionState } from "../workshops/quiz/store";

export interface AuthenticationData {
  token: string;
}

export interface SessionConnection {
  socket: Socket;
  profile: ProfileModelInstance;
}

export type SessionConnections = SessionConnection[];

export interface HandlersContext {
  authenticatedConnections: Map<
    string,
    { socket: Socket; profile: ProfileModelInstance }
  >;
  workshopSessions: Map<
    string,
    {
      readonly connections: SessionConnections;
      readonly store: Store<QuizSessionState, QuizActions>;
    }
  >;
  authPayload: AuthJwtPayload;
}
