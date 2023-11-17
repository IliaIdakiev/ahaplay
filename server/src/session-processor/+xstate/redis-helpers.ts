import { generateSessionMetadataRedisKey } from "../../apollo/resources/in-memory-metadata/helpers";
import { readFromRedis, saveInRedis } from "../../redis/utils";
import { SessionMachineSnapshot } from "./types";

export function readInMemorySessionMachineStateSnapshot(sessionId: string) {
  const inMemorySessionKey = generateSessionMetadataRedisKey({ sessionId });
  return readFromRedis<SessionMachineSnapshot>(inMemorySessionKey);
}

export function saveInMemorySessionMachineStateSnapshot(
  sessionId: string,
  sessionSnapshot: SessionMachineSnapshot
) {
  const inMemorySessionKey = generateSessionMetadataRedisKey({ sessionId });
  return saveInRedis<SessionMachineSnapshot>(
    inMemorySessionKey,
    sessionSnapshot
  );
}
