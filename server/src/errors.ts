export enum LoginError {
  MISSING_DATA = "MISSING_DATA",
  NOT_FOUND = "NOT_FOUND",
}

export enum RegistrationError {
  MISSING_WORKSPACE = "MISSING_WORKSPACE",
}

export enum AuthenticationError {
  TOKEN_NOT_FOUND = "TOKEN_NOT_FOUND",
  ALREADY_AUTHENTICATED = "ALREADY_AUTHENTICATED",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  UNKNOWN = "UNKNOWN",
}

export enum AuthorizationError {
  NOT_AUTHORIZED = "NOT_AUTHORIZED",
}

export enum RefreshTokenError {
  TOKEN_NOT_FOUND = "TOKEN_NOT_FOUND",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  CORRUPTED_TOKEN = "CORRUPTED_TOKEN",
  UNKNOWN = "UNKNOWN",
}

export enum DomainError {
  MISSING_DOMAIN = "MISSING_DOMAIN",
}
