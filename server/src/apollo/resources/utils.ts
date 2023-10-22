import { redisClient, InMemorySessionMetadata } from "../../redis";
import { SubscriptionAction } from "../typings/subscription-action";

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

export function withCancel<T>(
  asyncIterator: AsyncIterator<T | undefined>,
  onCancel: Function
): AsyncIterator<T | undefined> {
  let originalReturn = asyncIterator.return;

  asyncIterator.return = () => {
    onCancel();
    return originalReturn
      ? originalReturn.call(asyncIterator)
      : Promise.resolve({ value: undefined, done: true });
  };

  return asyncIterator;
}
