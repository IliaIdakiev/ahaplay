import { Request, Response } from "express";
import config from "../../../config";

const authCookieName = config.app.authCookieName;
const authHeaderName = config.app.authHeaderName;
const refreshTokenName = config.app.refreshTokenName;

export function readAuthToken(req: Request): string | null {
  const accessToken =
    req.headers[authHeaderName] || req.cookies[authCookieName];
  return accessToken || null;
}

export function readRefreshToken(req: Request): string | null {
  const refreshToken = req.headers[refreshTokenName] as string;
  return refreshToken || null;
}

export function setAuthToken(res: Response, accessToken: string) {
  return res.cookie(authCookieName, accessToken, { httpOnly: true });
}
