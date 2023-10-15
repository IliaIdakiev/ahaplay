export interface AuthJwtPayload {
  id: string;
  name: string;
  image: string;
  active_workspace_id: string;
}

export interface RefreshJwtPayload {
  clientId: string;
  jti: string;
}
