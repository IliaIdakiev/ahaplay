import { AuthenticatedUserData } from "../../types";

export type AuthJwtPayload = AuthenticatedUserData;

export interface RefreshJwtPayload {
  clientId: string;
  jti: string;
}
