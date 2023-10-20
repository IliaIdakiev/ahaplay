import gql from "graphql-tag";
import { redisClient } from "../../redis";
import { AppContext } from "../typings";
import { SessionModelInstance, SessionStatus, models } from "../../database";
import { getUnixTime } from "date-fns";
import { UniqueConstraintError } from "sequelize";
import {
  InMemorySessionMetadata,
  InMemorySessionStage,
} from "src/redis/typings";

export const sessionTypeDefs = gql`
  enum SessionStage {
    WAITING
    START_EMOTION_CHECK
    TEAM_NAME
    ON_GOING
    END_EMOTION_CHECK
    VIEW_RESULTS
  }

  type Session {
    id: String
    stage: SessionStage
  }
`;

export const sessionQueryDefs = gql`
  extend type Subscription {
    session(slot: String!, sessionId: String): Session
  }
`;

export const sessionSubscriptionResolvers = {
  session(
    _: undefined,
    data: { sessionId: string; slotId: string },
    contextValue: AppContext,
    info: any
  ) {
    const currentProfileId = contextValue.profileId;
    let getSession: Promise<InMemorySessionMetadata | null>;
    if (!data.sessionId) {
      getSession = models.slot.findByPk(data.slotId).then((slot) => {
        if (!slot || !slot.isOpenForSession()) {
          return null;
        }
        const sessionId = data.slotId; // >>> ??? what is this exactly?
        return models.session
          .create({
            status: SessionStatus.SCHEDULED,
            creator_id: currentProfileId,
            slot_id: data.slotId,
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
              return models.session.findOne({
                where: { session_key: sessionId },
              });
            }
            return Promise.reject(error);
          });
      });
    }
    getSession = redisClient
      .get(data.sessionId)
      .then((sessionString) => {
        if (sessionString == null) {
          return null;
        }
        try {
          return JSON.parse(sessionString!);
        } catch {
          return null;
        }
      })
      .then((existingSession) => {});
  },
};
