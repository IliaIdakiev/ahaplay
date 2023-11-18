import { redisClient } from "./client";

export const connectRedis = () =>
  redisClient
    .connect()
    .then(() => redisClient)
    .catch((error) => {
      console.error("Redis connection failed", error);
      return Promise.reject(error);
    });
