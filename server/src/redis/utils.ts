import { SessionStatus, models } from "../database";
import { redisClient } from "./client";
import { getUnixTime } from "date-fns";
import { InMemorySessionMetadata } from "./types";
import config from "../config";

export function generateRedisKey(key: string) {
  return `${config.redis.prefix}::${key}`;
}

export function syncActiveSessionsWithRedis() {
  if (!config.redis.enableInitSync) {
    return Promise.resolve();
  }
  console.log("Sync ongoing sessions with Redis...");
  return models.session
    .findAll({ where: { status: SessionStatus.ONGOING } })
    .then((sessions) =>
      Promise.all(
        sessions.map((databaseEntry) =>
          redisClient.get(databaseEntry.id).then((redisEntry) => {
            try {
              return [
                redisEntry
                  ? (JSON.parse(redisEntry) as InMemorySessionMetadata)
                  : null,
                databaseEntry,
              ] as const;
            } catch {
              return [null, databaseEntry] as const;
            }
          })
        )
      )
        .then((allEntries) =>
          Promise.all(
            allEntries.map(([redisEntry, databaseEntry]) => {
              if (
                redisEntry === null ||
                getUnixTime(redisEntry.lastUpdateTimestamp) <
                  getUnixTime(databaseEntry.update_date)
              ) {
                console.log(
                  `Updating session with id: ${databaseEntry.id} inside Redis.`
                );
                return redisClient
                  .set(databaseEntry.id, databaseEntry.state)
                  .then(() => redisClient.get(databaseEntry.id));
              }
              return redisEntry;
            })
          )
        )
        .then((results) => {
          console.log(
            `Synced ${results.length} of sessions from database to Redis`
          );
        })
    );
}
