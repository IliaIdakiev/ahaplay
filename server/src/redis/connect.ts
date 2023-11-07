import { redisClient } from "./client";
import { syncActiveSessionsWithRedis } from "./utils";

export const connectRedis = () =>
  redisClient
    .connect()
    .then(() => syncActiveSessionsWithRedis())
    .then(() => redisClient)
    .catch((error) => {
      console.error("Redis connection failed", error);
      return Promise.reject(error);
    });
