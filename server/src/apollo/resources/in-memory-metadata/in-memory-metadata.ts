import gql from "graphql-tag";
import {
  AppContext,
  InMemoryProfileMetadataError,
  InMemorySessionMetadataError,
} from "../../types";
import { withCancel } from "../utils";
import {
  generateProfileUpdateSubscriptionEvent,
  generateSessionUpdateSubscriptionEvent,
  readAndParseState,
  publishInMemorySessionMetadata,
  readInMemorySessionAndProfileMetadata,
  publishInMemoryProfileMetadata,
  readInMemorySession,
  readInMemoryProfile,
  getNextStage,
} from "./helpers";
import * as controller from "./controller";

import {
  InMemorySessionMetadata,
  InMemorySessionStage,
} from "../../../redis/types";

export const sessionAndProfileMetadataTypeDefs = gql`
  enum InMemorySessionStage {
    WAITING
    START_EMOTION_CHECK
    TEAM_NAME
    ON_GOING
    END_EMOTION_CHECK
    VIEW_RESULTS
  }
  
  type ActivityEntry {
    profileId: String
    questionId: String
    ready: Boolean
  }
  
  type ActivityMapArrayItem {
    key: String
    value: ActivityEntry
  }
  
  type EmotionEntry { 
    emotion: Int!
    profileId: String!
  }

  type InMemoryProfileMetadataStages {
    ${InMemorySessionStage.WAITING}: [String]!
    ${InMemorySessionStage.START_EMOTION_CHECK}: [String]!
    ${InMemorySessionStage.TEAM_NAME}: [String]!
    ${InMemorySessionStage.ON_GOING}: [String]!
    ${InMemorySessionStage.END_EMOTION_CHECK}: [String]!
    ${InMemorySessionStage.VIEW_RESULTS}: [String]!
  }

  type InMemorySessionMetadataState {
    participantProfileIds: [String]!
    teamName: String
    currentStage: InMemorySessionStage!
    activityIds: [String]!
    stages: InMemoryProfileMetadataStages!
    activityMap: [ActivityMapArrayItem]!
    currentActivityId: String
    allActivitiesFinished: Boolean!
    lastUpdateTimestamp: Int!
  }

  type InMemoryProfileMetadataState {
    activityIds: [String]!
    activityMap: [ActivityMapArrayItem]!
    currentActivityId: String
    finished: Boolean
    startEmotions: [EmotionEntry]!
    endEmotions: [EmotionEntry]!
    lastUpdateTimestamp: Int!
  }
`;

export const sessionMutationDefs = gql`
  type Mutation {
    setTeamName(sessionId: Int!, teamName: String!): String!
    setPersonalValue(sessionId: String!, questionId: String!): String!
    setGroupValue(sessionId: String!, questionId: String!): String!
    progressForward(profileId: Int!, sessionId: String!): String
  }
`;

export const sessionQueryDefs = gql`
  type Query {
    profileState(profileId: String!, slotId: String!): String
  }
`;

export const sessionSubscriptionDefs = gql`
  type Subscription {
    inMemorySessionMetadata(
      slotId: String!
      sessionId: String
    ): InMemorySessionMetadata
    inMemoryProfileMetadata(sessionId: String!): InMemoryProfileMetadata
  }
`;

export const mutationResolvers = {
  setTeamName(
    _: undefined,
    data: { sessionId: string; teamName: string },
    context: AppContext,
    info: any
  ) {
    return controller
      .updateInMemorySession(data.sessionId, (inMemorySession) => {
        inMemorySession.teamName = data.teamName;
        return inMemorySession;
      })
      .then((inMemorySession) => {
        publishInMemorySessionMetadata(context.pubSub, inMemorySession);
        return inMemorySession?.teamName || null;
      });
  },
  progressForward(
    _: undefined,
    data: { sessionId: string; activityId?: string },
    context: AppContext,
    info: any
  ): Promise<InMemorySessionMetadata | null> {
    // TODO: Finish this
    readInMemorySessionAndProfileMetadata(
      data.sessionId,
      context.authenticatedUser.profileId
    ).then(([inMemorySessionMetadata, inMemoryProfileMetadata]) => {
      const sessionState = readAndParseState(inMemorySessionMetadata);
      const profileState = readAndParseState(inMemoryProfileMetadata);
      let stage = inMemorySessionMetadata.stage;

      const isStartEmotionCheck =
        stage === InMemorySessionStage.START_EMOTION_CHECK;
      const isEndEmotionCheck =
        stage === InMemorySessionStage.END_EMOTION_CHECK;
      const isOnGoing = stage === InMemorySessionStage.ON_GOING;
      if (
        (isStartEmotionCheck &&
          typeof inMemoryProfileMetadata.startEmotion !== "number") ||
        (isEndEmotionCheck &&
          typeof inMemoryProfileMetadata.endEmotion !== "number") ||
        !data.activityId ||
        sessionState[data.activityId].includes(
          context.authenticatedUser.profileId
        )
      ) {
        return inMemorySessionMetadata;
      }

      if (
        stage !== InMemorySessionStage.ON_GOING &&
        !sessionState.stages[stage].includes(
          context.authenticatedUser.profileId
        )
      ) {
        sessionState.stages[stage] = sessionState.stages[stage].concat(
          context.authenticatedUser.profileId
        );
        if (
          sessionState.stages[stage].length ===
          inMemorySessionMetadata.groupCount
        ) {
          stage = getNextStage(stage);
        }
        inMemorySessionMetadata.stage = stage;
        inMemorySessionMetadata.state = JSON.stringify(sessionState);
      }

      if (
        stage === InMemorySessionStage.ON_GOING &&
        sessionState[data.activityId]
      ) {
      }
    });
    return Promise.resolve(null);
  },
  setPersonalValue(
    _: undefined,
    data: {
      sessionId: string;
      activityId?: string;
      questionId?: string;
      emotion?: number;
    },
    context: AppContext,
    info: any
  ) {
    return readInMemorySession(data.sessionId).then(
      (inMemorySessionMetadata) => {
        const stage = inMemorySessionMetadata.stage;
        const isStartEmotionCheck =
          stage === InMemorySessionStage.START_EMOTION_CHECK;
        const isEndEmotionCheck =
          stage === InMemorySessionStage.END_EMOTION_CHECK;
        if (isStartEmotionCheck || isEndEmotionCheck) {
          if (typeof data.emotion !== "number") {
            throw new Error(InMemoryProfileMetadataError.MISSING_VALUE);
          }
          return controller
            .updateInMemoryProfile(
              data.sessionId,
              context.authenticatedUser.profileId,
              (inMemoryProfileMetadata) => {
                if (isStartEmotionCheck) {
                  inMemoryProfileMetadata.startEmotion = data.emotion!;
                } else {
                  inMemoryProfileMetadata.endEmotion = data.emotion!;
                }
                return inMemoryProfileMetadata;
              }
            )
            .then((inMemoryProfileMetadata) =>
              publishInMemoryProfileMetadata(
                context.pubSub,
                data.sessionId,
                inMemoryProfileMetadata
              )
            );
        }
        if (stage === InMemorySessionStage.ON_GOING) {
          if (data.sessionId || !data.questionId || data.activityId) {
            throw new Error(InMemoryProfileMetadataError.MISSING_VALUE);
          }
          return controller
            .updateInMemoryProfile(
              data.sessionId,
              context.authenticatedUser.profileId,
              (inMemoryProfileMetadata) => {
                const state = readAndParseState(inMemoryProfileMetadata);
                state[data.activityId!] = data.questionId!;
                inMemoryProfileMetadata.state = state;
                return inMemoryProfileMetadata;
              }
            )
            .then((inMemoryProfileMetadata) =>
              publishInMemoryProfileMetadata(
                context.pubSub,
                data.sessionId,
                inMemoryProfileMetadata
              )
            );
        }
        return readInMemoryProfile(
          data.sessionId,
          context.authenticatedUser.profileId
        );
      }
    );
  },
  setGroupValue(
    _: undefined,
    data: { sessionId: string; questionId: string },
    context: AppContext,
    info: any
  ): Promise<null> {
    return Promise.resolve(null);
  },
};

export const subscriptionResolvers = {
  inMemorySessionMetadata: {
    subscribe(
      _: undefined,
      data: { sessionId: string; slotId: string },
      context: AppContext,
      info: any
    ) {
      return (
        data.sessionId
          ? readInMemorySessionAndProfileMetadata(
              data.sessionId,
              context.authenticatedUser.profileId,
              false
            )
          : controller.createInMemorySession(data.slotId, context)
      )
        .then(([inMemorySession, inMemoryProfile]) => {
          return controller.createSessionAndProfileMetadata(
            inMemorySession,
            inMemoryProfile,
            context
          );
        })
        .then(([inMemorySession, inMemoryProfile]) => {
          const eventName = generateSessionUpdateSubscriptionEvent({
            sessionId: inMemorySession.sessionId,
          });
          const asyncIterator = context.pubSub.asyncIterator(eventName);

          controller
            .publishSendInMemorySessionMetadata(
              inMemorySession.sessionId,
              context.pubSub
            )
            .catch((err) => {
              console.error(err);
            });

          controller.publishSendInMemoryProfileMetadata(
            inMemorySession.sessionId,
            inMemoryProfile.profileId,
            context.pubSub
          );

          return withCancel(asyncIterator, () => {
            controller.handleSessionUnsubscribe(
              inMemorySession,
              inMemoryProfile,
              context.pubSub
            );
          });
        });
    },
  },
  inMemoryProfileMetadata: {
    subscribe(
      _: undefined,
      data: { sessionId: string },
      context: AppContext,
      info: any
    ) {
      const eventName = generateProfileUpdateSubscriptionEvent({
        sessionId: data.sessionId,
        profileId: context.authenticatedUser.profileId,
      });
      const asyncIterator = context.pubSub.asyncIterator(eventName);

      controller
        .publishSendInMemoryProfileMetadata(
          data.sessionId,
          context.authenticatedUser.profileId,
          context.pubSub
        )
        .catch((err) => {
          console.error(err);
        });

      return asyncIterator;
    },
  },
};
