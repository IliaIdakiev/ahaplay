export enum AuthSocketServerEvents {
  Authenticate = "authenticate",
}

export enum AuthSocketClientEvents {
  AuthenticateError = "authenticate-error",
}

export enum WorkshopServerEvents {
  Join = "join",
}

export enum WorkshopClientEvents {
  SlotCancelled = "slot-cancelled",
  SlotNotFound = "slot-not-found",

  SessionNotOpen = "session-not-open",
}
