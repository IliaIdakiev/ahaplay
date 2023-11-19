import { generateSessionRedisKey } from "../../apollo/resources/session/helpers";
import { readFromRedis, saveInRedis } from "../../redis/utils";
import { SessionMachineSnapshot } from "./types";

export function readInMemorySessionMachineStateSnapshot(sessionId: string) {
  const inMemorySessionKey = generateSessionRedisKey({ sessionId });
  return readFromRedis<SessionMachineSnapshot>(inMemorySessionKey);
}

export function saveInMemorySessionMachineStateSnapshot(
  sessionId: string,
  sessionSnapshot: SessionMachineSnapshot
) {
  const inMemorySessionKey = generateSessionRedisKey({ sessionId });
  return saveInRedis<SessionMachineSnapshot>(
    inMemorySessionKey,
    sessionSnapshot
  );
}
