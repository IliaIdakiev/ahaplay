import { Request, Response, NextFunction } from "express";
import { AuthenticationError, LoginError, RefreshTokenError } from "../errors";
import { getWorkspaceWithProfiles } from "./utils/get-workspace-with-profiles";
import { decodeToken, verifyToken } from "./jwt";
import { readAuthToken, readRefreshToken, setAuthToken } from "./utils/token";
import { checkRefreshTokenJti } from "./utils/refresh-token-jti";
import { generateTokenPair } from "./utils/generate-token-pair";
import { AuthJwtPayload, RefreshJwtPayload } from "../types";

export function authenticateMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authToken = readAuthToken(req);
  if (!authToken) {
    return void next(new Error(AuthenticationError.TOKEN_NOT_FOUND));
  }

  verifyToken<AuthJwtPayload>(authToken)
    .then((data) => {
      req.authenticatedUserData = data;
      next();
    })
    .catch((err) => {
      next(
        new Error(
          err.message === "jwt expired"
            ? AuthenticationError.TOKEN_EXPIRED
            : AuthenticationError.UNKNOWN
        )
      );
    });
}

export function renewTokensHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const refreshToken = readRefreshToken(req);
  const accessToken = readAuthToken(req);

  if (!refreshToken || !accessToken) {
    return void next(
      new Error(
        !refreshToken
          ? RefreshTokenError.TOKEN_NOT_FOUND
          : AuthenticationError.TOKEN_NOT_FOUND
      )
    );
  }

  Promise.all([
    verifyToken<RefreshJwtPayload>(refreshToken),
    decodeToken<AuthJwtPayload>(accessToken),
  ])
    .then(([refreshTokenPayload, accessTokenPayload]) => {
      if (checkRefreshTokenJti(refreshTokenPayload, accessToken)) {
        generateTokenPair(accessTokenPayload).then(
          ({ accessToken, refreshToken }) => {
            setAuthToken(res, accessToken);
            res.send({ refreshToken });
          }
        );
      }
      next(new Error(RefreshTokenError.CORRUPTED_TOKEN));
    })
    .catch((err) =>
      next(
        new Error(
          err.message === "jwt expired"
            ? RefreshTokenError.TOKEN_EXPIRED
            : RefreshTokenError.UNKNOWN
        )
      )
    );
}

export function authenticationHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const domain = req.get("Host");
  const { email, password } = req.body;
  if (!email || !password || !domain) {
    return void next(new Error(LoginError.MISSING_DATA));
  }
  getWorkspaceWithProfiles({ emails: [email], domain })
    .then((workspace) => {
      if (!workspace || (workspace.profiles?.length || 0) === 0) {
        return void next(new Error(LoginError.NOT_FOUND));
      }
      const [profile] = workspace.profiles!;
      return profile
        .authenticate(password)
        .then((success) => (success ? workspace : null));
    })
    .then((workspace) => {
      if (!workspace) {
        return void next(new Error(LoginError.NOT_FOUND));
      }
      const [profile] = workspace.profiles!;
      const { id, name, image, active_workspace_id, email } = profile;
      const accessTokenPayload: AuthJwtPayload = {
        id,
        email,
        name,
        image,
        active_workspace_id,
      };

      generateTokenPair(accessTokenPayload).then(
        ({ accessToken, refreshToken }) => {
          const profile = workspace.profiles![0]!;
          setAuthToken(res, accessToken);
          res.send({ email: profile.email, name: profile.name, refreshToken });
        }
      );
    });
}
