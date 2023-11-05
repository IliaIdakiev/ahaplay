import gql from "graphql-tag";
import { AuthenticatedAppContext, InMemorySessionStage } from "../../types";
import { withCancel } from "../utils";
import {
  generateProfileUpdateSubscriptionEvent,
  generateSessionUpdateSubscriptionEvent,
  publishInMemoryProfileMetadataState,
  publishInMemorySessionMetadataState,
} from "./helpers";
import * as controller from "./controller";
import { createInMemoryDispatcher } from "./+state";
import {
  addParticipant,
  endEmotionReady,
  groupActivityReady,
  profileActivityReady,
  readyToStart,
  removeParticipant,
  setEndEmotion,
  setGroupActivityValue,
  setProfileActivityValue,
  setStartEmotion,
  setTeamName,
  startEmotionReady,
  teamNameReady,
} from "./+state/actions";
import { InMemorySessionMetadataGraphQLState } from "../../types/in-memory-session-metadata-graphql-state";
import { InMemoryProfileMetadataGraphQLState } from "../../types/in-memory-profile-metadata-graphql-state";

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
    value: [ActivityEntry]
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
    sessionId: String!
    profileIds: [String]!
    connectedProfileIds: [String]!
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
    sessionId: String!
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
    setProfileAsSessionParticipant(
      sessionId: Int!
    ): InMemorySessionMetadataState!
    unsetProfileAsSessionParticipant(
      sessionId: Int!
    ): InMemorySessionMetadataState!
    readyToStart(sessionId: Int!): InMemorySessionMetadataState!
    setTeamName(
      sessionId: Int!
      teamName: String!
    ): InMemorySessionMetadataState!
    setTeamNameAsReady(sessionId: Int!): InMemorySessionMetadataState!
    setStartEmotion(
      sessionId: String!
      emotion: Int!
    ): InMemoryProfileMetadataState!
    setStartEmotionAsReady(sessionId: String!): InMemoryProfileMetadataState!
    setEndEmotion(
      sessionId: String!
      emotion: Int!
    ): InMemoryProfileMetadataState!
    setEndEmotionAsReady(sessionId: String!): InMemoryProfileMetadataState!

    setProfileActivityValue(
      sessionId: String!
      questionId: String!
    ): InMemoryProfileMetadataState!
    setProfileActivityAsReady(sessionId: String!): InMemoryProfileMetadataState!
    setGroupActivityValue(
      sessionId: String!
      questionId: String!
    ): InMemorySessionMetadataState!
    setGroupActivityAsReady(sessionId: String!): InMemorySessionMetadataState!
  }
`;

export const sessionSubscriptionDefs = gql`
  type Subscription {
    inMemorySessionMetadataState(
      slotId: String!
      sessionId: String
    ): InMemorySessionMetadataState
    inMemoryProfileMetadataState(
      sessionId: String!
    ): InMemoryProfileMetadataState
  }
`;

export const mutationResolvers = {
  setProfileAsSessionParticipant(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          addParticipant({ ids: context.authenticatedProfile.profileId })
        )
      )
      .then(([{ state: inMemorySessionMetadataState }]) =>
        publishInMemorySessionMetadataState(
          context.pubSub,
          inMemorySessionMetadataState
        )
      )
      .then(
        ([, inMemorySessionMetadataStateForGraphQL]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  unsetProfileAsSessionParticipant(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          removeParticipant({ ids: context.authenticatedProfile.profileId })
        )
      )
      .then(([{ state: inMemorySessionMetadataState }]) =>
        publishInMemorySessionMetadataState(
          context.pubSub,
          inMemorySessionMetadataState
        )
      )
      .then(
        ([, inMemorySessionMetadataStateForGraphQL]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  readyToStart(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          readyToStart({ profileId: context.authenticatedProfile.profileId })
        )
      )
      .then(([{ state: inMemorySessionMetadataState }]) =>
        publishInMemorySessionMetadataState(
          context.pubSub,
          inMemorySessionMetadataState
        )
      )
      .then(
        ([, inMemorySessionMetadataStateForGraphQL]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  setTeamName(
    _: undefined,
    data: { sessionId: string; teamName: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(setTeamName({ teamName: data.teamName }))
      )
      .then(([{ state: inMemorySessionMetadataState }]) =>
        publishInMemorySessionMetadataState(
          context.pubSub,
          inMemorySessionMetadataState
        )
      )
      .then(
        ([, inMemorySessionMetadataStateForGraphQL]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  setTeamNameAsReady(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          teamNameReady({ profileId: context.authenticatedProfile.profileId })
        )
      )
      .then(([{ state: inMemorySessionMetadataState }]) =>
        publishInMemorySessionMetadataState(
          context.pubSub,
          inMemorySessionMetadataState
        )
      )
      .then(
        ([, inMemorySessionMetadataStateForGraphQL]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  setStartEmotion(
    _: undefined,
    data: { sessionId: string; emotion: number },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemoryProfileMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          setStartEmotion({
            emotion: data.emotion,
            profileId: context.authenticatedProfile.profileId,
          })
        )
      )
      .then(([, { state: inMemoryProfileMetadataState }]) =>
        publishInMemoryProfileMetadataState(
          context.pubSub,
          inMemoryProfileMetadataState
        )
      )
      .then(
        ([, inMemoryProfileMetadataStateForGraphQL]) =>
          inMemoryProfileMetadataStateForGraphQL
      );
  },
  setStartEmotionAsReady(
    _: undefined,
    data: { sessionId: string; emotion: number },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemoryProfileMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          startEmotionReady({
            profileId: context.authenticatedProfile.profileId,
          })
        )
      )
      .then(([, { state: inMemoryProfileMetadataState }]) =>
        publishInMemoryProfileMetadataState(
          context.pubSub,
          inMemoryProfileMetadataState
        )
      )
      .then(
        ([, inMemoryProfileMetadataStateForGraphQL]) =>
          inMemoryProfileMetadataStateForGraphQL
      );
  },
  setEndEmotionAsReady(
    _: undefined,
    data: { sessionId: string; emotion: number },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemoryProfileMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          endEmotionReady({
            profileId: context.authenticatedProfile.profileId,
          })
        )
      )
      .then(([, { state: inMemoryProfileMetadataState }]) =>
        publishInMemoryProfileMetadataState(
          context.pubSub,
          inMemoryProfileMetadataState
        )
      )
      .then(
        ([, inMemoryProfileMetadataStateForGraphQL]) =>
          inMemoryProfileMetadataStateForGraphQL
      );
  },
  setEndEmotion(
    _: undefined,
    data: { sessionId: string; emotion: number },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemoryProfileMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          setEndEmotion({
            emotion: data.emotion,
            profileId: context.authenticatedProfile.profileId,
          })
        )
      )
      .then(([, { state: inMemoryProfileMetadataState }]) =>
        publishInMemoryProfileMetadataState(
          context.pubSub,
          inMemoryProfileMetadataState
        )
      )
      .then(
        ([, inMemoryProfileMetadataStateForGraphQL]) =>
          inMemoryProfileMetadataStateForGraphQL
      );
  },
  setProfileActivityValue(
    _: undefined,
    data: {
      sessionId: string;
      questionId: string;
    },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemoryProfileMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          setProfileActivityValue({
            profileId: context.authenticatedProfile.profileId,
            questionId: data.questionId,
          })
        )
      )
      .then(([, { state: inMemoryProfileMetadataState }]) =>
        publishInMemoryProfileMetadataState(
          context.pubSub,
          inMemoryProfileMetadataState
        )
      )
      .then(
        ([, inMemoryProfileMetadataStateForGraphQL]) =>
          inMemoryProfileMetadataStateForGraphQL
      );
  },
  setProfileActivityAsReady(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemoryProfileMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          profileActivityReady({
            profileId: context.authenticatedProfile.profileId,
          })
        )
      )
      .then(([, { state: inMemoryProfileMetadataState }]) =>
        publishInMemoryProfileMetadataState(
          context.pubSub,
          inMemoryProfileMetadataState
        )
      )
      .then(
        ([, inMemoryProfileMetadataStateForGraphQL]) =>
          inMemoryProfileMetadataStateForGraphQL
      );
  },
  setGroupActivityValue(
    _: undefined,
    data: {
      sessionId: string;
      questionId: string;
    },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          setGroupActivityValue({
            profileId: context.authenticatedProfile.profileId,
            questionId: data.questionId,
          })
        )
      )
      .then(([{ state: inMemorySessionMetadataState }]) =>
        publishInMemorySessionMetadataState(
          context.pubSub,
          inMemorySessionMetadataState
        )
      )
      .then(
        ([, inMemorySessionMetadataStateForGraphQL]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  setGroupActivityAsReady(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          groupActivityReady({
            profileId: context.authenticatedProfile.profileId,
          })
        )
      )
      .then(([{ state: inMemorySessionMetadataState }]) =>
        publishInMemorySessionMetadataState(
          context.pubSub,
          inMemorySessionMetadataState
        )
      )
      .then(
        ([, inMemorySessionMetadataStateForGraphQL]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
};

export const subscriptionResolvers = {
  inMemorySessionMetadataState: {
    subscribe(
      _: undefined,
      data: { slotId: string; sessionId?: string },
      context: AuthenticatedAppContext,
      info: any
    ) {
      const { pubSub } = context;
      const { profileId } = context.authenticatedProfile;
      const { sessionId, slotId } = data;
      const handler = sessionId
        ? controller.handleSessionSubscriptionForSessionId(profileId, sessionId)
        : controller.handleSessionSubscriptionWithSlotId(profileId, slotId);

      return handler.then((inMemorySessionMetadataState) => {
        const eventName = generateSessionUpdateSubscriptionEvent({
          sessionId: inMemorySessionMetadataState.sessionId,
        });
        controller.readAndPublishInMemorySessionMetadataState(
          inMemorySessionMetadataState.sessionId,
          pubSub
        );
        const asyncIterator = context.pubSub.asyncIterator(eventName);
        return withCancel(asyncIterator, () => {
          controller.handleSessionUnsubscribe(
            profileId,
            inMemorySessionMetadataState.sessionId,
            pubSub
          );
        });
      });
    },
  },
  inMemoryProfileMetadataState: {
    subscribe(
      _: undefined,
      data: { sessionId: string },
      context: AuthenticatedAppContext,
      info: any
    ) {
      const eventName = generateProfileUpdateSubscriptionEvent({
        sessionId: data.sessionId,
      });
      const asyncIterator = context.pubSub.asyncIterator(eventName);
      controller.readAndPublishInMemoryProfileMetadataState(
        data.sessionId,
        context.pubSub
      );
      return asyncIterator;
    },
  },
};
