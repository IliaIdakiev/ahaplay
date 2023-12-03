import { createToken } from "../jwt";
import { getRefreshTokenJti } from "./refresh-token-jti";
import config from "../../config";
import { AuthJwtPayload, RefreshJwtPayload } from "../../types";

const accessTokenExpiryTime = config.app.jwt.accessTokenExpiryTime;
const refreshTokenExpiryTime = config.app.jwt.refreshTokenExpiryTime;

export function generateTokenPair(accessTokenPayload: AuthJwtPayload) {
  return createToken<AuthJwtPayload>(accessTokenPayload, accessTokenExpiryTime)
    .then((accessToken) => {
      const refreshTokenPayload: RefreshJwtPayload = {
        clientId: accessTokenPayload.id,
        jti: getRefreshTokenJti(accessToken),
      };
      return createToken<RefreshJwtPayload>(
        refreshTokenPayload,
        refreshTokenExpiryTime
      ).then((refreshToken) => ({
        refreshToken,
        accessToken,
      }));
    })
    .then(({ accessToken, refreshToken }) => ({
      accessToken,
      refreshToken,
    }));
}
