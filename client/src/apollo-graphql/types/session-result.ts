import { Session } from "./session";

export interface SessionResult {
  getSession: {
    millisecondsToStart: number;
    session: Session;
  };
}
