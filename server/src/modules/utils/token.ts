import { Request, Response } from "express";
import config from "../../config";

const authCookieName = config.app.authCookieName;
const authHeaderName = config.app.authHeaderName;
const refreshTokenName = config.app.refreshTokenName;

function capitalizeFirstLetter(string: string) {
  return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
}
function lowercaseFirstLetter(string: string) {
  return `${string.charAt(0).toLowerCase()}${string.slice(1)}`;
}

export function readAuthToken(req: {
  headers?: any;
  cookies?: any;
}): string | null {
  const accessToken: string =
    req.headers?.[lowercaseFirstLetter(authHeaderName)] ||
    req.cookies?.[lowercaseFirstLetter(authCookieName)] ||
    req.headers?.[capitalizeFirstLetter(authHeaderName)] ||
    req.cookies?.[capitalizeFirstLetter(authCookieName)] ||
    "";
  return accessToken.replace(/Bearer\s?/g, "") || null;
}

export function readRefreshToken(req: Request): string | null {
  const refreshToken = req.headers[refreshTokenName] as string;
  return refreshToken || null;
}

export function setAuthToken(res: Response, accessToken: string) {
  return res.cookie(authCookieName, accessToken, { httpOnly: true });
}
