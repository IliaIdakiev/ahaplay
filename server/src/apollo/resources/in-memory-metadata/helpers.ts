import {
  SubscriptionAction,
  InMemorySessionMetadataError,
  InMemoryProfileMetadataError,
  ProfileAction,
} from "../../types";
import {
  activityAssociationNames,
  models,
  questionAssociationNames,
  workshopAssociationNames,
} from "../../../database";
import { readFromRedis, saveInRedis } from "../utils";
import { RedisPubSub } from "graphql-redis-subscriptions";
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

export function publishInMemorySessionMetadataState(
  pubSub: RedisPubSub,
  inMemorySessionMetadataState: InMemorySessionMetadataState
) {
  const { sessionId } = inMemorySessionMetadataState;
  const eventName = generateSessionUpdateSubscriptionEvent({
    sessionId,
  });
  const inMemorySessionMetadataStateForGraphQL =
    graphqlInMemorySessionStateSerializer(inMemorySessionMetadataState);

  pubSub.publish(eventName, {
    inMemorySessionMetadataState: {
      ...inMemorySessionMetadataStateForGraphQL,
    },
  });
  return inMemorySessionMetadataState;
}

export function publishInMemoryProfileMetadataState(
  pubSub: RedisPubSub,
  inMemoryProfileMetadataState: InMemoryProfileMetadataState
) {
  const { sessionId } = inMemoryProfileMetadataState;
  const eventName = generateProfileUpdateSubscriptionEvent({
    sessionId,
  });
  const inMemoryProfileMetadataStateForGraphQL =
    graphqlInMemoryProfileStateSerializer(inMemoryProfileMetadataState);

  pubSub.publish(eventName, {
    inMemoryProfileMetadataState: {
      ...inMemoryProfileMetadataStateForGraphQL,
    },
  });
  return inMemoryProfileMetadataStateForGraphQL;
}

// export function readAndParseState(
//   entry: InMemorySessionMetadata | InMemoryProfileMetadata
// ) {
//   try {
//     return JSON.parse(entry.state);
//   } catch (e) {
//     console.error(e);
//     const isSession = "sessionId" in entry;
//     throw new Error(
//       isSession
//         ? InMemorySessionError.SESSION_STATE_MALFORMED
//         : InMemoryProfileMetadataError.PROFILE_STATE_MALFORMED
//     );
//   }
// }

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

export function readInMemorySessionMetadataState(
  sessionId: string,
  allowNull: true
): Promise<InMemorySessionMetadataState | null>;
export function readInMemorySessionMetadataState(
  sessionId: string,
  allowNull: false
): Promise<InMemorySessionMetadataState>;
export function readInMemorySessionMetadataState(
  sessionId: string
): Promise<InMemorySessionMetadataState>;
export function readInMemorySessionMetadataState(
  sessionId: string,
  allowNull = false
) {
  const inMemorySessionKey = generateSessionMetadataRedisKey({ sessionId });
  return readFromRedis<InMemorySessionMetadataState>(inMemorySessionKey).then(
    (session) => {
      if (allowNull === false && session === null) {
        throw new Error(InMemorySessionMetadataError.SESSION_NOT_FOUND);
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
  sessionId: string
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
        throw new Error(InMemoryProfileMetadataError.PROFILE_NOT_FOUND);
      }
      return profile;
    }
  );
}

export function generateSessionUpdateSubscriptionEvent(config: {
  sessionId: string;
}) {
  return `${SubscriptionAction.IN_MEMORY_SESSION_UPDATE}::${config.sessionId}`;
}

export function generateProfileUpdateSubscriptionEvent(config: {
  sessionId: string;
}) {
  return `${ProfileAction.PROFILE_UPDATE}::${config.sessionId}`;
}

export function generateSessionKey(config: { slotId: string }) {
  // TODO: Improve this because I'm not sure what exactly it should be
  return config.slotId;
}

export function generateSessionMetadataRedisKey(config: { sessionId: string }) {
  return `sessionId:${config.sessionId}::session`;
}

export function generateProfileMetadataRedisKey(config: { sessionId: string }) {
  return `sessionId:${config.sessionId}::profile`;
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