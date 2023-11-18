import { redisClient } from "./client";

export function readFromRedis<T, P = false>(
  key: string,
  noParse?: P
): Promise<T | null>;
export function readFromRedis<T extends string = string>(
  key: string,
  noParse: true
): Promise<T | null>;
export function readFromRedis(key: string, noParse: boolean = false) {
  return redisClient.get(key).then((string) => {
    if (string === null) {
      return null;
    }
    try {
      if (noParse) {
        return string;
      }
      return JSON.parse(string!);
    } catch {
      return null;
    }
  });
}

export function saveInRedis<T, P = false>(
  key: string,
  value: T,
  noParse?: P
): Promise<T>;
export function saveInRedis<T extends string = string>(
  key: string,
  value: T,
  noParse: true
): Promise<T>;
export function saveInRedis(key: string, value: any, noParse?: boolean) {
  const redisValue = noParse ? value : JSON.stringify(value);
  return redisClient.set(key, redisValue).then(() => value);
}
