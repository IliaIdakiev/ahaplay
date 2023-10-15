import { sign, verify, decode } from "jsonwebtoken";
import { SignOptions } from "jsonwebtoken";
import config from "../../config";

const jwtSecret = config.app.jwt.secret;
const issuer = config.app.jwt.issuer;

// NOTE: All options -> https://github.com/auth0/node-jsonwebtoken
const baseOptions: SignOptions = {
  issuer: issuer,
};

export function createToken<T extends string | Object | Buffer>(
  payload: T,
  expiryTime?: number | string
): Promise<string> {
  const options: SignOptions = !!expiryTime
    ? { ...baseOptions, expiresIn: expiryTime }
    : { ...baseOptions };

  return new Promise<string>((resolve, reject) => {
    sign(payload, jwtSecret, options, (err, token) => {
      if (err) {
        return void reject(err);
      }
      resolve(token as string);
    });
  });
}

export function decodeToken<T>(token: string): Promise<T> {
  return Promise.resolve(decode(token)) as Promise<T>;
}

export function verifyToken<T>(token: string): Promise<T> {
  return new Promise<any>((resolve, reject) => {
    verify(token, jwtSecret, baseOptions, (err, decoded) => {
      if (err) {
        return void reject(err);
      }
      resolve(decoded);
    });
  });
}
