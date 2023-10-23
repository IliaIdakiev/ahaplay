import { UniqueConstraintError } from "sequelize";
import { getUnixTime } from "date-fns";
import {
  AppContext,
  SubscriptionAction,
  SubscriptionError,
} from "../../../apollo/typings";
import {
  activityAssociationNames,
  models,
  questionAssociationNames,
  SessionModelInstance,
  SessionStatus,
  workshopAssociationNames,
} from "../../../database";
import {
  InMemorySessionMetadata,
  redisClient,
  InMemorySessionStage,
  InMemoryProfileMetadata,
} from "../../../redis";
import { generateSessionKey, readFromRedis, saveInRedis } from "../utils";

export function sendLatestInMemorySessionAsync(
  inMemorySession: InMemorySessionMetadata,
  context: AppContext,
  eventName: string
) {
  return redisClient.get(inMemorySession.sessionId).then((value) => {
    if (value === null) {
      return null;
    }
    try {
      const latestInMemorySession = JSON.parse(value);
      context.pubSub.publish(eventName, {
        inMemorySessionMetadata: {
          ...latestInMemorySession,
          timestamp: getUnixTime(new Date()),
        },
      });
      return inMemorySession;
    } catch {
      console.error("err");
    }
  });
}

function readSlotWithWorkshopActivitiesAndRelatedQuestions(slotId: string) {
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

export function createInMemorySessionHandler(
  slotId: string,
  context: AppContext
): Promise<[InMemorySessionMetadata | null, InMemoryProfileMetadata | null]> {
  const { profileId } = context.authenticatedUser;
  return readSlotWithWorkshopActivitiesAndRelatedQuestions(slotId).then(
    (slot) => {
      if (
        !slot ||
        !slot.isOpenForSession() ||
        !slot.workshop ||
        !slot.workshop.activities ||
        slot.workshop.activities.length === 0
      ) {
        return [null, null];
      }

      const sessionKey = generateSessionKey(slotId); // TODO: Improve the generateSessionKey export function
      return models.session
        .create({
          status: SessionStatus.SCHEDULED,
          creator_id: context.authenticatedUser.profileId,
          slot_id: slotId,
          workshop_id: slot.workshop_id,
          workspace_id: slot.workspace_id,
          session_key: sessionKey,
        })
        .catch((error) => {
          if (error instanceof UniqueConstraintError) {
            return models.session.findOne({
              where: { slot_id: slotId, state: SessionStatus.SCHEDULED },
            });
          }
          return Promise.reject(error);
        })
        .then(
          (
            session
          ): Promise<
            [
              SessionModelInstance | null,
              string | null,
              InMemoryProfileMetadata | null,
              InMemorySessionMetadata | null
            ]
          > => {
            if (!session) {
              return Promise.resolve([null, null, null, null]);
            }
            if (session.state) {
              return Promise.all([
                session,
                session.state,
                readFromRedis<InMemoryProfileMetadata>(profileId),
                readFromRedis<InMemorySessionMetadata>(session.id),
              ]);
            }
            const state: Record<string, string | null> = {};
            for (const activity of slot.workshop!.activities!) {
              state[activity.id] = null;
            }
            return Promise.all([
              session,
              JSON.stringify(state),
              readFromRedis<InMemoryProfileMetadata>(profileId),
              readFromRedis<InMemorySessionMetadata>(session.id),
            ]);
          }
        )
        .then(
          ([session, stateString, inMemoryProfile, inMemorySession]): Promise<
            [InMemorySessionMetadata | null, InMemoryProfileMetadata | null]
          > => {
            if (session === null || stateString === null) {
              return Promise.resolve([null, inMemoryProfile]);
            }
            const currentInMemorySession = inMemorySession || {
              sessionId: session!.id,
              profileIds: [],
              stage: InMemorySessionStage.WAITING,
              teamName: null,
              state: stateString,
              lastUpdateTimestamp: getUnixTime(new Date()),
            };

            if (!currentInMemorySession.profileIds.includes(profileId)) {
              currentInMemorySession.profileIds.push(profileId);
            }

            const currentInMemoryProfile = inMemoryProfile || {
              state: stateString,
              profileId,
              isConnected: true,
              isActive: true,
            };

            if (currentInMemoryProfile.isConnected === false) {
              currentInMemoryProfile.isConnected = true;
            }

            return Promise.all([
              saveInRedis<InMemorySessionMetadata>(
                currentInMemorySession.sessionId,
                currentInMemorySession
              ),
              saveInRedis<InMemoryProfileMetadata>(
                currentInMemoryProfile.profileId,
                currentInMemoryProfile
              ),
            ]);
          }
        );
    }
  );
}

export function handleSessionSubscription(
  inMemorySession: InMemorySessionMetadata,
  inMemoryProfile: InMemoryProfileMetadata | null,
  context: AppContext
) {
  if (inMemoryProfile) {
    inMemoryProfile.isConnected = true;
  } else if (inMemorySession.stage === InMemorySessionStage.WAITING) {
    inMemoryProfile = {
      isActive: true,
      isConnected: true,
      profileId: context.authenticatedUser.profileId,
      state: inMemorySession.state,
    };
  } else {
    throw new Error(SubscriptionError.SESSION_ALREADY_STARTED);
  }
  return Promise.all([
    saveInRedis<InMemorySessionMetadata>(
      inMemorySession.sessionId,
      inMemorySession
    ),
    saveInRedis<InMemoryProfileMetadata>(
      inMemoryProfile.profileId,
      inMemoryProfile
    ),
  ]);
}

export function handleSessionUnsubscribe(
  inMemoryProfile: InMemoryProfileMetadata
) {
  inMemoryProfile.isConnected = false;
  return saveInRedis<InMemoryProfileMetadata>(
    inMemoryProfile.profileId,
    inMemoryProfile
  );
}

export function readInMemorySessionAndProfileMetadata(
  sessionId: string,
  profileId: string
) {
  return Promise.all([
    readFromRedis<InMemorySessionMetadata>(sessionId),
    readFromRedis<InMemoryProfileMetadata>(profileId),
  ]);
}

export function generateSessionUpdateSubscriptionEvent(sessionId: string) {
  return `${SubscriptionAction.IN_MEMORY_SESSION_UPDATE}::${sessionId}`;
}
