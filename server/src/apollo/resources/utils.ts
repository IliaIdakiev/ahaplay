import { redisClient, InMemorySessionMetadata } from "../../redis";
import { SubscriptionAction } from "../typings";

export function generateSessionKey(slotId: string) {
  // TODO: Improve this because I'm not sure what exactly it should be
  return slotId;
}

export function getInMemorySessionMetadata(sessionId: string) {
  return redisClient.get(sessionId).then((sessionString) => {
    if (sessionString === null) {
      return null;
    }
    try {
      return JSON.parse(sessionString!) as InMemorySessionMetadata;
    } catch {
      return null;
    }
  });
}

export function generateSessionUpdateSubscriptionEvent(sessionId: string) {
  return `${SubscriptionAction.IN_MEMORY_SESSION_UPDATE}::${sessionId}`;
}
