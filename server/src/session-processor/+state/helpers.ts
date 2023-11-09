import { readFromRedis, saveInRedis } from "../../redis/utils";
import {
  generateSessionMetadataRedisKey,
  generateProfileMetadataRedisKey,
} from "../../apollo/resources/in-memory-metadata/helpers";

import {
  InMemorySessionMetadataStateError,
  InMemoryProfileMetadataStateError,
} from "../../apollo/types";
import {
  InMemorySessionMetadataState,
  InMemoryProfileMetadataState,
} from "./reducers";
import { InMemorySessionStage } from "./types";

export function getNextStage(currentStage: InMemorySessionStage) {
  if (currentStage === InMemorySessionStage.WAITING) {
    return InMemorySessionStage.START_EMOTION_CHECK;
  }
  if (currentStage === InMemorySessionStage.START_EMOTION_CHECK) {
    return InMemorySessionStage.TEAM_NAME;
  }
  if (currentStage === InMemorySessionStage.TEAM_NAME) {
    return InMemorySessionStage.ON_GOING;
  }
  if (currentStage === InMemorySessionStage.ON_GOING) {
    return InMemorySessionStage.END_EMOTION_CHECK;
  }
  return InMemorySessionStage.VIEW_RESULTS;
}

export function readInMemorySessionMetadataState(
  sessionId: string,
  allowNull: true
): Promise<InMemorySessionMetadataState | null>;
export function readInMemorySessionMetadataState(
  sessionId: string,
  allowNull: false
): Promise<InMemorySessionMetadataState>;
export function readInMemorySessionMetadataState(
  sessionId: string,
  allowNull?: boolean
): Promise<InMemorySessionMetadataState>;
export function readInMemorySessionMetadataState(
  sessionId: string,
  allowNull = false
) {
  const inMemorySessionKey = generateSessionMetadataRedisKey({ sessionId });
  return readFromRedis<InMemorySessionMetadataState>(inMemorySessionKey).then(
    (session) => {
      if (allowNull === false && session === null) {
        throw new Error(InMemorySessionMetadataStateError.SESSION_NOT_FOUND);
      }
      return session;
    }
  );
}

export function readInMemoryProfileMetadataState(
  sessionId: string,
  allowNull: true
): Promise<InMemoryProfileMetadataState | null>;
export function readInMemoryProfileMetadataState(
  sessionId: string,
  allowNull: false
): Promise<InMemoryProfileMetadataState>;
export function readInMemoryProfileMetadataState(
  sessionId: string,
  allowNull?: boolean
): Promise<InMemoryProfileMetadataState>;
export function readInMemoryProfileMetadataState(
  sessionId: string,
  allowNull = false
) {
  const profileStateKey = generateProfileMetadataRedisKey({
    sessionId,
  });
  return readFromRedis<InMemoryProfileMetadataState>(profileStateKey).then(
    (profile) => {
      if (allowNull === false && profile === null) {
        throw new Error(InMemoryProfileMetadataStateError.PROFILE_NOT_FOUND);
      }
      return profile;
    }
  );
}

export function saveInMemorySessionMetadataState(
  inMemorySessionMetadataState: InMemorySessionMetadataState
) {
  const { sessionId } = inMemorySessionMetadataState;
  const inMemorySessionKey = generateSessionMetadataRedisKey({ sessionId });
  return saveInRedis<InMemorySessionMetadataState>(
    inMemorySessionKey,
    inMemorySessionMetadataState
  );
}

export function saveInMemoryProfileMetadataState(
  inMemoryProfileMetadataState: InMemoryProfileMetadataState
) {
  const { sessionId } = inMemoryProfileMetadataState;
  const inMemoryProfileStateKey = generateProfileMetadataRedisKey({
    sessionId,
  });
  return saveInRedis<InMemoryProfileMetadataState>(
    inMemoryProfileStateKey,
    inMemoryProfileMetadataState
  );
}
