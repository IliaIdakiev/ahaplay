import {
  SubscriptionAction,
  InMemorySessionError,
  InMemoryProfileMetadataError,
  ProfileAction,
} from "../../types";
import {
  activityAssociationNames,
  models,
  questionAssociationNames,
  workshopAssociationNames,
} from "../../../database";
import {
  InMemorySessionMetadata,
  InMemoryProfileMetadata,
  InMemorySessionStage,
} from "../../../redis/types";
import { readFromRedis, saveInRedis } from "../utils";
import { RedisPubSub } from "graphql-redis-subscriptions";
import { getUnixTime } from "date-fns";
import {
  InMemoryProfileMetadataState,
  InMemorySessionMetadataState,
} from "./+state/reducers";
import { InMemoryProfileMetadataGraphQLState } from "../../types/in-memory-profile-metadata-graphql-state";
import { MakeAllKeysRequired } from "../../../types";
import { InMemorySessionMetadataGraphQLState } from "../../types/in-memory-session-metadata-graphql-state";

export function graphqlInMemorySessionStateSerializer(
  state: MakeAllKeysRequired<InMemorySessionMetadataState>
): InMemorySessionMetadataGraphQLState {
  let { activityMap, ...other } = state;
  const activityMapArray = Object.entries(activityMap).map(([key, value]) => ({
    key,
    value,
  }));

  return {
    ...other,
    activityMap: activityMapArray,
  };
}

export function graphqlInMemoryProfileStateSerializer(
  state: MakeAllKeysRequired<InMemoryProfileMetadataState>
): InMemoryProfileMetadataGraphQLState {
  let { activityMap, ...other } = state;
  const activityMapArray = Object.entries(activityMap).map(([key, value]) => ({
    key,
    value,
  }));

  return {
    ...other,
    activityMap: activityMapArray,
  };
}

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

export function publishInMemorySessionMetadata(
  pubSub: RedisPubSub,
  inMemorySession: InMemorySessionMetadata
) {
  const eventName = generateSessionUpdateSubscriptionEvent({
    sessionId: inMemorySession.sessionId,
  });
  pubSub.publish(eventName, {
    inMemorySessionMetadata: {
      ...inMemorySession,
      timestamp: getUnixTime(new Date()),
    },
  });
  return inMemorySession;
}

export function publishInMemoryProfileMetadata(
  pubSub: RedisPubSub,
  sessionId: string,
  inMemoryProfile: InMemoryProfileMetadata
) {
  const eventName = generateProfileUpdateSubscriptionEvent({
    profileId: inMemoryProfile.profileId,
    sessionId,
  });

  pubSub.publish(eventName, {
    inMemoryProfileMetadata: {
      ...inMemoryProfile,
      timestamp: getUnixTime(new Date()),
    },
  });
  return inMemoryProfile;
}

export function readAndParseState(
  entry: InMemorySessionMetadata | InMemoryProfileMetadata
) {
  try {
    return JSON.parse(entry.state);
  } catch (e) {
    console.error(e);
    const isSession = "sessionId" in entry;
    throw new Error(
      isSession
        ? InMemorySessionError.SESSION_STATE_MALFORMED
        : InMemoryProfileMetadataError.PROFILE_STATE_MALFORMED
    );
  }
}

export function saveInMemorySession(
  sessionId: string,
  sessionMetadata: InMemorySessionMetadata
) {
  const inMemorySessionKey = generateSessionMetadataRedisKey({ sessionId });
  return saveInRedis<InMemorySessionMetadata>(
    inMemorySessionKey,
    sessionMetadata
  );
}

export function saveInMemoryProfile(
  sessionId: string,
  profileMetadata: InMemoryProfileMetadata
) {
  const inMemoryProfileStateKey = generateProfileMetadataRedisKey({
    profileId: profileMetadata.profileId,
    sessionId,
  });
  return saveInRedis<InMemoryProfileMetadata>(
    inMemoryProfileStateKey,
    profileMetadata
  );
}

export function readInMemorySession(
  sessionId: string,
  allowNull: true
): Promise<InMemorySessionMetadata | null>;
export function readInMemorySession(
  sessionId: string,
  allowNull: false
): Promise<InMemorySessionMetadata>;
export function readInMemorySession(
  sessionId: string
): Promise<InMemorySessionMetadata>;
export function readInMemorySession(sessionId: string, allowNull = false) {
  const inMemorySessionKey = generateSessionMetadataRedisKey({ sessionId });
  return readFromRedis<InMemorySessionMetadata>(inMemorySessionKey).then(
    (session) => {
      if (allowNull === false && session === null) {
        throw new Error(InMemorySessionError.SESSION_NOT_FOUND);
      }
      return session;
    }
  );
}

export function readInMemoryProfile(
  sessionId: string,
  profileId: string,
  allowNull: true
): Promise<InMemoryProfileMetadata | null>;
export function readInMemoryProfile(
  sessionId: string,
  profileId: string,
  allowNull: false
): Promise<InMemoryProfileMetadata>;
export function readInMemoryProfile(
  sessionId: string,
  profileId: string
): Promise<InMemoryProfileMetadata>;
export function readInMemoryProfile(
  sessionId: string,
  profileId: string,
  allowNull = false
) {
  const profileStateKey = generateProfileMetadataRedisKey({
    profileId,
    sessionId,
  });
  return readFromRedis<InMemoryProfileMetadata>(profileStateKey).then(
    (profile) => {
      if (allowNull === false && profile === null) {
        throw new Error(InMemoryProfileMetadataError.PROFILE_NOT_FOUND);
      }
      return profile;
    }
  );
}

export function readInMemorySessionAndProfileMetadata(
  sessionId: string,
  profileId: string,
  allowNullForSession: false,
  allowNullForProfile: true
): Promise<[InMemorySessionMetadata, InMemoryProfileMetadata | null]>;
export function readInMemorySessionAndProfileMetadata(
  sessionId: string,
  profileId: string,
  allowNullForSession: true,
  allowNullForProfile: false
): Promise<[InMemorySessionMetadata | null, InMemoryProfileMetadata]>;
export function readInMemorySessionAndProfileMetadata(
  sessionId: string,
  profileId: string,
  allowNullForSession: false,
  allowNullForProfile: false
): Promise<[InMemorySessionMetadata, InMemoryProfileMetadata]>;
export function readInMemorySessionAndProfileMetadata(
  sessionId: string,
  profileId: string,
  allowNullForSession: true,
  allowNullForProfile: true
): Promise<[InMemorySessionMetadata | null, InMemoryProfileMetadata | null]>;
export function readInMemorySessionAndProfileMetadata(
  sessionId: string,
  profileId: string,
  allowNullForSession: true
): Promise<[InMemorySessionMetadata | null, InMemoryProfileMetadata | null]>;
export function readInMemorySessionAndProfileMetadata(
  sessionId: string,
  profileId: string,
  allowNullForSession: false
): Promise<[InMemorySessionMetadata, InMemoryProfileMetadata | null]>;
export function readInMemorySessionAndProfileMetadata(
  sessionId: string,
  profileId: string
): Promise<[InMemorySessionMetadata, InMemoryProfileMetadata]>;
export function readInMemorySessionAndProfileMetadata(
  sessionId: string,
  profileId: string,
  allowNullForSession: any = false,
  allowNullForProfile: any = false
) {
  return Promise.all([
    readInMemorySession(sessionId, allowNullForSession),
    readInMemoryProfile(sessionId, profileId, allowNullForProfile),
  ]);
}

export function generateSessionUpdateSubscriptionEvent(config: {
  sessionId: string;
}) {
  return `${SubscriptionAction.IN_MEMORY_SESSION_UPDATE}::${config.sessionId}`;
}

export function generateProfileUpdateSubscriptionEvent(config: {
  sessionId: string;
  profileId: string;
}) {
  return `${ProfileAction.PROFILE_UPDATE}::${config.sessionId}>${config.profileId}`;
}

export function generateSessionKey(config: { slotId: string }) {
  // TODO: Improve this because I'm not sure what exactly it should be
  return config.slotId;
}

export function generateSessionMetadataRedisKey(config: { sessionId: string }) {
  return `sessionId:${config.sessionId}`;
}

export function generateProfileMetadataRedisKey(config: {
  sessionId: string;
  profileId: string;
}) {
  return `sessionId:${config.sessionId}>profile:${config.profileId}`;
}

export function readSlotWithWorkshopActivitiesAndRelatedQuestions(
  slotId: string
) {
  return models.slot.findByPk(slotId, {
    include: [
      {
        model: models.workshop,
        as: workshopAssociationNames.singular,
        include: [
          {
            model: models.activity,
            as: activityAssociationNames.plural,
            include: [
              {
                model: models.question,
                as: questionAssociationNames.plural,
              },
            ],
          },
        ],
      },
    ],
  });
}
