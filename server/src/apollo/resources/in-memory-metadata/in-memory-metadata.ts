import gql from "graphql-tag";
import { AppContext } from "../../types";
import { withCancel } from "../utils";
import {
  generateProfileUpdateSubscriptionEvent,
  generateSessionUpdateSubscriptionEvent,
  readInMemorySessionAndProfileMetadata,
} from "./helpers";
import * as controller from "./controller";

import { InMemorySessionMetadata } from "../../../redis";

export const sessionAndProfileMetadataTypeDefs = gql`
  enum InMemorySessionStage {
    WAITING
    START_EMOTION_CHECK
    TEAM_NAME
    ON_GOING
    END_EMOTION_CHECK
    VIEW_RESULTS
  }

  type InMemoryProfileMetadata {
    profileId: String!
    isActive: Boolean!
    state: String
    timestamp: Int!
  }

  type InMemorySessionMetadata {
    stage: InMemorySessionStage!
    teamName: String
    sessionId: String!
    lastUpdateTimestamp: Int
    timestamp: Int!
    state: String!
    profileIds: [String]
    activeProfileIds: [String]
    connectedProfileIds: [String]
  }
`;

export const sessionMutationDefs = gql`
  type Mutation {
    setTeamName(sessionId: Int!, teamName: String!): String
    markActivityAsReady(
      profileId: Int!
      sessionId: String!
    ): InMemorySessionMetadata
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
        return controller
          .sendInMemorySessionMetadata(
            inMemorySession.sessionId,
            context.pubSub
          )
          .then((inMemorySession) => inMemorySession?.teamName || null);
      });
  },
  markActivityAsReady(
    _: undefined,
    data: { sessionId: string; activityId: string },
    context: AppContext,
    info: any
  ): Promise<InMemorySessionMetadata | null> {
    return Promise.resolve(null);
  },
  setProfileValueForActivity(
    _: undefined,
    data: { sessionId: string; activityId: string; answerId: string },
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
            .sendInMemorySessionMetadata(
              inMemorySession.sessionId,
              context.pubSub
            )
            .catch((err) => {
              console.error(err);
            });

          controller.sendInMemoryProfileMetadata(
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
        .sendInMemoryProfileMetadata(
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
