import { SessionStatus, models } from "../database";
import { redisClient } from "./client";
import { getUnixTime } from "date-fns";
import config from "../config";
import { InMemorySessionMetadataState } from "../session-processor/+state/reducers";

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
                  ? (JSON.parse(redisEntry) as InMemorySessionMetadataState)
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
                redisEntry.lastUpdateTimestamp === null ||
                redisEntry.lastUpdateTimestamp <
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
