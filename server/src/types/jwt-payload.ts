import { AuthenticatedUserData } from "./authenticated-user-data";

export type AuthJwtPayload = AuthenticatedUserData;

export interface RefreshJwtPayload {
  clientId: string;
  jti: string;
}
