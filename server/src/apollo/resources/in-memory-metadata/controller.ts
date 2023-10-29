import { getUnixTime } from "date-fns";
import { UniqueConstraintError } from "sequelize";
import { AppContext, InMemorySessionError } from "../../types";
import { models, SessionStatus } from "../../../database";
import {
  InMemorySessionMetadata,
  InMemoryProfileMetadata,
  InMemorySessionStage,
} from "../../../redis";
import {
  readSlotWithWorkshopActivitiesAndRelatedQuestions,
  generateSessionKey,
  readInMemoryProfile,
  readInMemorySession,
  generateSessionUpdateSubscriptionEvent,
  generateProfileUpdateSubscriptionEvent,
  saveInMemoryProfile,
  saveInMemorySession,
} from "./helpers";
import { RedisPubSub } from "graphql-redis-subscriptions";

export function sendInMemorySessionMetadata(
  sessionId: string,
  pubSub: RedisPubSub
) {
  const eventName = generateSessionUpdateSubscriptionEvent({ sessionId });
  return readInMemorySession(sessionId).then((inMemorySession) => {
    pubSub.publish(eventName, {
      inMemorySessionMetadata: {
        ...inMemorySession,
        timestamp: getUnixTime(new Date()),
      },
    });
    return inMemorySession;
  });
}

export function sendInMemoryProfileMetadata(
  sessionId: string,
  profileId: string,
  pubSub: RedisPubSub
) {
  const eventName = generateProfileUpdateSubscriptionEvent({
    profileId,
    sessionId,
  });
  return readInMemoryProfile(sessionId, profileId).then((inMemoryProfile) => {
    pubSub.publish(eventName, {
      inMemoryProfileMetadata: {
        ...inMemoryProfile,
        timestamp: getUnixTime(new Date()),
      },
    });
    return inMemoryProfile;
  });
}

export function createInMemorySession(slotId: string, context: AppContext) {
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
        throw new Error(InMemorySessionError.SESSION_NOT_FOUND);
      }

      const sessionKey = generateSessionKey({ slotId });
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
              where: { slot_id: slotId, status: SessionStatus.SCHEDULED },
            });
          }
          return Promise.reject(error);
        })
        .then((session) => {
          if (!session) {
            throw new Error(InMemorySessionError.SESSION_NOT_FOUND);
          }
          if (session.state) {
            return Promise.all([
              session,
              session.state,
              readInMemoryProfile(session.id, profileId, true),
              readInMemorySession(session.id),
            ]);
          }
          const state: Record<string, string | null> = {};
          for (const activity of slot.workshop!.activities!) {
            state[activity.id] = null;
          }
          return Promise.all([
            session,
            JSON.stringify(state),
            readInMemoryProfile(session.id, profileId, true),
            readInMemorySession(session.id, true),
          ]);
        })
        .then(
          ([session, stateString, inMemoryProfile, inMemorySession]): Promise<
            [InMemorySessionMetadata, InMemoryProfileMetadata | null]
          > => {
            if (session === null || stateString === null) {
              throw new Error(InMemorySessionError.SESSION_NOT_FOUND);
            }
            const currentInMemorySession: InMemorySessionMetadata =
              inMemorySession || {
                sessionId: session!.id,
                profileIds: [],
                activeProfileIds: [],
                connectedProfileIds: [],
                stage: InMemorySessionStage.WAITING,
                teamName: null,
                state: stateString,
                lastUpdateTimestamp: getUnixTime(new Date()),
              };

            if (!currentInMemorySession.profileIds.includes(profileId)) {
              currentInMemorySession.profileIds.push(profileId);
            }
            if (!currentInMemorySession.activeProfileIds.includes(profileId)) {
              currentInMemorySession.activeProfileIds.push(profileId);
            }
            if (
              !currentInMemorySession.connectedProfileIds.includes(profileId)
            ) {
              currentInMemorySession.connectedProfileIds.push(profileId);
            }

            const currentInMemoryProfile: InMemoryProfileMetadata =
              inMemoryProfile || {
                state: stateString,
                profileId,
                isActive: true,
              };

            return Promise.all([
              saveInMemorySession(
                currentInMemorySession.sessionId,
                currentInMemorySession
              ),
              saveInMemoryProfile(
                currentInMemorySession.sessionId,
                currentInMemoryProfile.profileId,
                currentInMemoryProfile
              ),
            ]);
          }
        );
    }
  );
}

export function updateInMemorySession(
  sessionId: string,
  updateFunction: (
    inMemorySession: InMemorySessionMetadata
  ) => InMemorySessionMetadata
) {
  const handleRequestTimestamp = getUnixTime(new Date());
  return readInMemorySession(sessionId).then((inMemorySession) => {
    if (handleRequestTimestamp < inMemorySession.lastUpdateTimestamp) {
      throw new ErrorWithData(
        InMemorySessionError.SESSION_OUTDATED,
        inMemorySession
      );
    }
    inMemorySession = updateFunction(inMemorySession);
    return saveInMemorySession(sessionId, inMemorySession);
  });
}

export function createSessionAndProfileMetadata(
  inMemorySession: InMemorySessionMetadata,
  inMemoryProfile: InMemoryProfileMetadata | null,
  context: AppContext
) {
  if (inMemorySession.stage === InMemorySessionStage.WAITING) {
    inMemoryProfile = {
      isActive: true,
      profileId: context.authenticatedUser.profileId,
      state: inMemorySession.state,
    };
  } else {
    throw new Error(InMemorySessionError.SESSION_ALREADY_STARTED);
  }
  return Promise.all([
    saveInMemorySession(inMemorySession.sessionId, inMemorySession),
    saveInMemoryProfile(
      inMemorySession.sessionId,
      inMemoryProfile.profileId,
      inMemoryProfile
    ),
  ]);
}

export function handleSessionUnsubscribe(
  inMemorySession: InMemorySessionMetadata,
  inMemoryProfile: InMemoryProfileMetadata,
  pubSub: RedisPubSub
) {
  const indexOfConnected = inMemorySession.connectedProfileIds.indexOf(
    inMemoryProfile.profileId
  );
  if (indexOfConnected !== -1) {
    inMemorySession.connectedProfileIds = [
      ...inMemorySession.connectedProfileIds.slice(0, indexOfConnected),
      ...inMemorySession.connectedProfileIds.slice(indexOfConnected + 1),
    ];
  }

  return Promise.all([
    saveInMemoryProfile(
      inMemorySession.sessionId,
      inMemoryProfile.profileId,
      inMemoryProfile
    ),
    saveInMemorySession(inMemorySession.sessionId, inMemorySession),
  ]).then(([inMemoryProfileMetadata, inMemorySession]) => {
    const profileEventName = generateProfileUpdateSubscriptionEvent({
      profileId: inMemoryProfile.profileId,
      sessionId: inMemorySession.sessionId,
    });

    pubSub.publish(profileEventName, {
      inMemoryProfileMetadata: {
        ...inMemoryProfileMetadata,
        timestamp: getUnixTime(new Date()),
      },
    });

    const sessionEventName = generateSessionUpdateSubscriptionEvent({
      sessionId: inMemorySession.sessionId,
    });

    pubSub.publish(sessionEventName, {
      inMemorySessionMetadata: {
        ...inMemorySession,
        timestamp: getUnixTime(new Date()),
      },
    });
  });
}
