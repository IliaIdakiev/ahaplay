import { RefreshJwtPayload } from "../../types";

export function checkRefreshTokenJti(
  refreshTokenData: RefreshJwtPayload,
  accessToken: string
) {
  const accessTokenCut = accessToken.slice(5, 10); // TODO: implement something more complex
  return accessTokenCut === refreshTokenData.jti;
}

export function getRefreshTokenJti(accessToken: string) {
  const accessTokenCut = accessToken.slice(5, 10); // TODO: implement something more complex
  return accessTokenCut;
}
