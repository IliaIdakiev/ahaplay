import { RedisClientOptions, createClient } from "redis";
import config from "../config";

export function generateRedisKey(key: string) {
  return `${config.redis.prefix}::${key}`;
}

const redisUrl = config.redis.url;

const redisOptions: RedisClientOptions = {
  url: redisUrl,
};

export const redisClient = createClient(redisOptions);

const originalGet = redisClient.get;
const originalSet = redisClient.set;

redisClient.get = function (
  this: any,
  ...args: Parameters<typeof originalGet>
) {
  args[0] = generateRedisKey(args[0] as string);
  return originalGet.call(this, ...args);
} as any;

redisClient.set = function (
  this: any,
  ...args: Parameters<typeof originalSet>
) {
  args[0] = generateRedisKey(args[0] as string);
  return originalSet.call(this, ...args);
} as any;

console.log(
  `Redis client get and set have been overridden to apply prefix: ${config.redis.prefix}`
);
