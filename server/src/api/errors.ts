export enum LoginError {
  MISSING_DATA = "MISSING_DATA",
  NOT_FOUND = "NOT_FOUND",
}

export enum AuthenticationError {
  TOKEN_NOT_FOUND = "TOKEN_NOT_FOUND",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  UNKNOWN = "UNKNOWN",
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
