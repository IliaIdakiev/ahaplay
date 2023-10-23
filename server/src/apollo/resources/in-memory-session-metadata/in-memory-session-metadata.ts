import gql from "graphql-tag";
import { getUnixTime } from "date-fns";
import { AppContext } from "../../typings/context";
import { SubscriptionError, QueryError } from "../../typings";
import {
  generateProfileStateKey,
  generateSessionKey,
  readFromRedis,
  saveInRedis,
  withCancel,
} from "../utils";
import {
  sendLatestInMemorySessionAsync,
  createInMemorySessionHandler,
  handleSessionSubscription,
  handleSessionUnsubscribe,
  generateSessionUpdateSubscriptionEvent,
  readInMemorySessionAndProfileMetadata,
} from "./helpers";

import { InMemorySessionMetadata, InMemorySessionStage } from "../../../redis";

export const sessionTypeDefs = gql`
  enum InMemorySessionStage {
    WAITING
    START_EMOTION_CHECK
    TEAM_NAME
    ON_GOING
    END_EMOTION_CHECK
    VIEW_RESULTS
  }

  type ConnectedProfileMetadata {
    profileId: String!
    isActive: Boolean!
    isConnected: Boolean!
    state: String
  }

  type InMemorySessionMetadata {
    stage: InMemorySessionStage!
    teamName: String
    sessionId: String!
    lastUpdateTimestamp: Int
    timestamp: Int!
    state: String!
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
    profileState(
      profileId: String!
      slotId: String!
    ): String;
  }
`;

export const sessionSubscriptionDefs = gql`
  type Subscription {
    inMemorySessionMetadata(
      slotId: String!
      sessionId: String
    ): InMemorySessionMetadata
  }
`;

export const sessionMutationResolvers = {
  setTeamName(
    _: undefined,
    data: { sessionId: string; teamName: string },
    context: AppContext,
    info: any
  ) {
    const handleRequestTimestamp = getUnixTime(new Date());
    return readFromRedis<InMemorySessionMetadata>(data.sessionId).then(
      (inMemorySession) => {
        if (!inMemorySession) {
          throw new Error(SubscriptionError.SESSION_NOT_FOUND);
        }
        if (handleRequestTimestamp < inMemorySession.lastUpdateTimestamp) {
          return inMemorySession.teamName;
        }
        inMemorySession.teamName = data.teamName;
        return saveInRedis<InMemorySessionMetadata>(
          data.sessionId,
          inMemorySession
        ).then((inMemorySession) => {
          const eventName = generateSessionUpdateSubscriptionEvent(
            inMemorySession.sessionId
          );
          return sendLatestInMemorySessionAsync(
            inMemorySession,
            context,
            eventName
          ).then((inMemorySession) => inMemorySession?.teamName || null);
        });
      }
    );
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

export const sessionSubscriptionResolvers = {
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
              context.authenticatedUser.profileId
            )
          : createInMemorySessionHandler(data.slotId, context)
      )
        .then(([inMemorySession, inMemoryProfile]) => {
          if (inMemorySession === null) {
            throw new Error(SubscriptionError.SESSION_NOT_FOUND);
          }

          return handleSessionSubscription(
            inMemorySession,
            inMemoryProfile,
            context
          );
        })
        .then(([inMemorySession, inMemoryProfile]) => {
          const eventName = generateSessionUpdateSubscriptionEvent(
            inMemorySession.sessionId
          );
          const asyncIterator = context.pubSub.asyncIterator(eventName);
          sendLatestInMemorySessionAsync(inMemorySession, context, eventName);

          return withCancel(asyncIterator, () => {
            handleSessionUnsubscribe(inMemoryProfile);
          });
        });
    },
  },
};

export const sessionQueryResolvers = {
  profileState(
    _: undefined,
    data: { profileId: string; sessionId: string },
    context: AppContext,
    info: any
  ): Promise<string | null> {
    const profileStateKey = generateProfileStateKey(
      data.profileId,
      data.sessionId
    );
    const inMemorySessionKey = generateSessionKey(data.sessionId);
    return Promise.all([
      readFromRedis(profileStateKey, true),
      readFromRedis<InMemorySessionMetadata>(inMemorySessionKey),
    ]).then(([profileStateJSON, inMemorySession]) => {
      if (typeof profileStateJSON === "string") {
        return profileStateJSON;
      }
      if (!inMemorySession) {
        throw new Error(QueryError.IN_MEMORY_SESSION_NOT_FOUND);
      }
      if (inMemorySession.stage === InMemorySessionStage.WAITING) {
        return inMemorySession.state;
      }
      console.log("SESSION LOST!");
      const newState: Record<string, string | null> = {};
      for (const key of Object.keys(inMemorySession.state)) {
        newState[key] = null;
      }
      return JSON.stringify(newState);
      // Uncomment when profileSession is set inside the session collection
      // or modify when we have profileSession collection
      // return models.session.findByPk(data.sessionId).then((session) => {
      //   if (!session) {
      //     console.log("SESSION LOST!");
      //     const newState: Record<string, string | null> = {};
      //     for (const key of Object.keys(inMemorySession.state)) {
      //       newState[key] = null;
      //     }
      //     return JSON.stringify(newState);
      //   }
      //   return session.state;
      // });
    });
  },
};
