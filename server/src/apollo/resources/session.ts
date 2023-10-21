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

  type InMemorySessionMetadata {
    stage: InMemorySessionStage
    sessionId: String
    lastUpdateTimestamp: Int
  }
`;

export const sessionSubscriptionDefs = gql`
  type Subscription {
    session(slot: String!, sessionId: String): InMemorySessionMetadata
  }
`;

export const sessionSubscriptionResolvers = {
  session: {
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
      ).then((inMemorySession) => {
        if (inMemorySession === null) {
          throw new Error(SubscriptionError.SESSION_NOT_FOUND);
        }
        const asyncIterator = context.pubSub.asyncIterator(
          generateSessionUpdateSubscriptionEvent(inMemorySession.sessionId)
        );

        return [inMemorySession, asyncIterator];
      });
    },
  },
};

function createInMemorySessionHandler(
  slotId: string,
  context: AppContext
): Promise<InMemorySessionMetadata | null> {
  return models.slot.findByPk(slotId).then((slot) => {
    if (!slot || !slot.isOpenForSession()) {
      return null;
    }
    const sessionId = generateSessionKey(slotId); // TODO: Improve the generateSessionKey function
    return models.session
      .create({
        status: SessionStatus.SCHEDULED,
        creator_id: context.authenticatedUser.profileId,
        slot_id: slotId,
        workshop_id: slot.workshop_id,
        workspace_id: slot.workshop_id,
        session_key: sessionId,
      })
      .then((session) => {
        const inMemorySessionMetadata: InMemorySessionMetadata = {
          stage: InMemorySessionStage.WAITING,
          sessionId: session.id,
          lastUpdateTimestamp: getUnixTime(new Date()),
        };
        const sessionJson = JSON.stringify(inMemorySessionMetadata);
        return redisClient
          .set(session.id, sessionJson)
          .then(() => inMemorySessionMetadata);
      })
      .catch((error) => {
        if (error instanceof UniqueConstraintError) {
          return getInMemorySessionMetadata(slotId);
        }
        return Promise.reject(error);
      });
  });
}
