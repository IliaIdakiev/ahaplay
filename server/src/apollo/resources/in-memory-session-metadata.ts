import gql from "graphql-tag";
import { getUnixTime } from "date-fns";
import { UniqueConstraintError } from "sequelize";
import { redisClient } from "../../redis";
import { AppContext } from "../typings/context";
import { SessionStatus, models } from "../../database";
import {
  InMemorySessionMetadata,
  InMemorySessionStage,
} from "../../redis/typings";
import { SubscriptionError } from "../typings/subscription-error";
import {
  generateSessionKey,
  generateSessionUpdateSubscriptionEvent,
  getInMemorySessionMetadata,
  withCancel,
} from "./utils";

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
    profileId: String
    isActive: Boolean
    isConnected: Boolean
  }

  type InMemorySessionMetadata {
    stage: InMemorySessionStage
    sessionId: String
    lastUpdateTimestamp: Int
    connectedProfileMetadata: [ConnectedProfileMetadata]
    timestamp: Int
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
          ? getInMemorySessionMetadata(data.sessionId)
          : createInMemorySessionHandler(data.slotId, context)
      )
        .then((inMemorySession) => {
          if (inMemorySession === null) {
            throw new Error(SubscriptionError.SESSION_NOT_FOUND);
          }

          return handleProfileConnectionToInMemorySession(
            inMemorySession,
            context
          );
        })
        .then((inMemorySession) => {
          const eventName = generateSessionUpdateSubscriptionEvent(
            inMemorySession.sessionId
          );
          const asyncIterator = context.pubSub.asyncIterator(eventName);
          sendLatestInMemorySessionAsync(inMemorySession, context, eventName);

          return withCancel(asyncIterator, () => {
            handleProfileDisconnectionToInMemorySession(
              inMemorySession,
              context,
              eventName
            );
          });
        });
    },
  },
};

function sendLatestInMemorySessionAsync(
  inMemorySession: InMemorySessionMetadata,
  context: AppContext,
  eventName: string
) {
  redisClient.get(inMemorySession.sessionId).then((value) => {
    if (value === null) {
      return;
    }
    try {
      const latestInMemorySession = JSON.parse(value);
      context.pubSub.publish(eventName, {
        inMemorySessionMetadata: {
          ...latestInMemorySession,
          timestamp: getUnixTime(new Date()),
        },
      });
    } catch {
      console.error("err");
    }
  });
}

function createInMemorySessionHandler(
  slotId: string,
  context: AppContext
): Promise<InMemorySessionMetadata | null> {
  return models.slot.findByPk(slotId).then((slot) => {
    if (!slot || !slot.isOpenForSession()) {
      return null;
    }
    const sessionKey = generateSessionKey(slotId); // TODO: Improve the generateSessionKey function
    return models.session
      .create({
        status: SessionStatus.SCHEDULED,
        creator_id: context.authenticatedUser.profileId,
        slot_id: slotId,
        workshop_id: slot.workshop_id,
        workspace_id: slot.workspace_id,
        session_key: sessionKey,
      })
      .then((session) => {
        const inMemorySessionMetadata: InMemorySessionMetadata = {
          stage: InMemorySessionStage.WAITING,
          sessionId: session.id,
          lastUpdateTimestamp: getUnixTime(new Date()),
          connectedProfileMetadata: [],
        };
        const sessionJson = JSON.stringify(inMemorySessionMetadata);
        return redisClient
          .set(session.id, sessionJson)
          .then(() => inMemorySessionMetadata);
      })
      .catch((error) => {
        console.error(error);
        if (error instanceof UniqueConstraintError) {
          return models.session
            .findOne({ where: { slot_id: slotId } })
            .then((session) => {
              if (!session) {
                return null;
              }
              return getInMemorySessionMetadata(session.id);
            });
        }
        return Promise.reject(error);
      });
  });
}

function handleProfileConnectionToInMemorySession(
  inMemorySession: InMemorySessionMetadata,
  context: AppContext
) {
  const inMemoryProfileMetadata = inMemorySession.connectedProfileMetadata.find(
    (e) => e.profileId === context.authenticatedUser.profileId
  );
  if (inMemoryProfileMetadata) {
    inMemoryProfileMetadata.isConnected = true;
  } else {
    inMemorySession.connectedProfileMetadata.push({
      isActive: true,
      isConnected: true,
      profileId: context.authenticatedUser.profileId,
    });
  }
  return redisClient
    .set(inMemorySession.sessionId, JSON.stringify(inMemorySession))
    .then(() => inMemorySession);
}

function handleProfileDisconnectionToInMemorySession(
  inMemorySession: InMemorySessionMetadata,
  context: AppContext,
  eventName: string
) {
  const inMemoryProfileMetadata = inMemorySession.connectedProfileMetadata.find(
    (e) => e.profileId === context.authenticatedUser.profileId
  )!;
  inMemoryProfileMetadata.isConnected = false;
  return redisClient
    .set(inMemorySession.sessionId, JSON.stringify(inMemorySession))
    .then(() => {
      context.pubSub.publish(eventName, {
        inMemorySessionMetadata: {
          ...inMemorySession,
          timestamp: getUnixTime(new Date()),
        },
      });
      return inMemorySession;
    });
}
