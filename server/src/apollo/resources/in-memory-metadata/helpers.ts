import { SubscriptionAction, ProfileAction } from "../../types";
import {
  activityAssociationNames,
  answerAssociationNames,
  assignmentAssociationNames,
  benchmarkAssociationNames,
  conceptAssociationNames,
  conceptualizationAssociationNames,
  goalAssociationNames,
  instructionAssociationNames,
  models,
  questionAssociationNames,
  theoryAssociationNames,
  typeAssociationNames,
  workshopAssociationNames,
} from "../../../database";
import { RedisPubSub } from "graphql-redis-subscriptions";
import {
  InMemoryProfileMetadataState,
  InMemorySessionMetadataState,
} from "../../../session-processor/+state/reducers";
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
  inMemorySessionMetadataState: InMemorySessionMetadataState,
  inMemorySessionMetadataStateForGraphQL?: InMemorySessionMetadataGraphQLState
) {
  const { sessionId } = inMemorySessionMetadataState;
  const eventName = generateSessionUpdateSubscriptionEvent({
    sessionId,
  });
  inMemorySessionMetadataStateForGraphQL =
    inMemorySessionMetadataStateForGraphQL ||
    graphqlInMemorySessionStateSerializer(inMemorySessionMetadataState);

  pubSub.publish(eventName, {
    inMemorySessionMetadataState: {
      ...inMemorySessionMetadataStateForGraphQL,
    },
  });
  return [
    inMemorySessionMetadataState,
    inMemorySessionMetadataStateForGraphQL,
  ] as const;
}

export function publishInMemoryProfileMetadataState(
  pubSub: RedisPubSub,
  inMemoryProfileMetadataState: InMemoryProfileMetadataState,
  inMemoryProfileMetadataStateForGraphQL?: InMemoryProfileMetadataGraphQLState
) {
  const { sessionId } = inMemoryProfileMetadataState;
  const eventName = generateProfileUpdateSubscriptionEvent({
    sessionId,
  });
  inMemoryProfileMetadataStateForGraphQL =
    inMemoryProfileMetadataStateForGraphQL ||
    graphqlInMemoryProfileStateSerializer(inMemoryProfileMetadataState);

  pubSub.publish(eventName, {
    inMemoryProfileMetadataState: {
      ...inMemoryProfileMetadataStateForGraphQL,
    },
  });
  return [
    inMemoryProfileMetadataState,
    inMemoryProfileMetadataStateForGraphQL,
  ] as const;
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
            model: models.goal,
            as: goalAssociationNames.plural,
            order: [["sequence_number", "ASC"]],
          },
          {
            model: models.type,
            as: typeAssociationNames.singular,
            include: [
              {
                model: models.instruction,
                as: instructionAssociationNames.plural,
                order: [["sequence_number", "ASC"]],
              },
            ],
          },
          {
            model: models.activity,
            as: activityAssociationNames.plural,
            order: [["sequence_number", "ASC"]],
            include: [
              {
                model: models.question,
                as: questionAssociationNames.singular,
              },
              {
                model: models.answer,
                as: answerAssociationNames.plural,
              },
              {
                model: models.benchmark,
                as: benchmarkAssociationNames.singular,
              },
              {
                model: models.conceptualization,
                as: conceptualizationAssociationNames.singular,
              },
              {
                model: models.concept,
                as: conceptAssociationNames.plural,
                order: [["sequence_number", "ASC"]],
              },
              {
                model: models.theory,
                as: theoryAssociationNames.singular,
              },
              {
                model: models.assignment,
                as: assignmentAssociationNames.singular,
              },
            ],
          },
        ],
      },
    ],
  });
}
