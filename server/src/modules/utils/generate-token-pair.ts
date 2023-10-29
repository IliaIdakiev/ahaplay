import { AuthJwtPayload, RefreshJwtPayload } from "../../api/interfaces";
import { createToken } from "../jwt";
import { getRefreshTokenJti } from "./refresh-token-jti";
import config from "../../config";

const accessTokenExpieryTime = config.app.jwt.accessTokenExpieryTime;
const refreshTokenExpieryTime = config.app.jwt.refreshTokenExpieryTime;

export function generateTokenPair(accessTokenPayload: AuthJwtPayload) {
  return createToken<AuthJwtPayload>(accessTokenPayload, accessTokenExpieryTime)
    .then((accessToken) => {
      const refreshTokenPayload: RefreshJwtPayload = {
        clientId: accessTokenPayload.id,
        jti: getRefreshTokenJti(accessToken),
      };
      return createToken<RefreshJwtPayload>(
        refreshTokenPayload,
        refreshTokenExpieryTime
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
