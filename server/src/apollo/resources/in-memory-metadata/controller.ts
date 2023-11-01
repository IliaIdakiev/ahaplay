import { getUnixTime } from "date-fns";
import { UniqueConstraintError } from "sequelize";
import {
  AppContext,
  InMemoryProfileMetadataError,
  InMemorySessionError,
} from "../../types";
import { models, SessionStatus } from "../../../database";
import {
  InMemorySessionMetadata,
  InMemoryProfileMetadata,
  InMemorySessionStage,
} from "../../../redis/types";
import {
  readSlotWithWorkshopActivitiesAndRelatedQuestions,
  generateSessionKey,
  readInMemoryProfile,
  readInMemorySession,
  saveInMemoryProfile,
  saveInMemorySession,
  publishInMemorySessionMetadata,
  publishInMemoryProfileMetadata,
} from "./helpers";
import { RedisPubSub } from "graphql-redis-subscriptions";

export function readSendInMemorySessionMetadata(
  sessionId: string,
  pubSub: RedisPubSub
) {
  return readInMemorySession(sessionId).then((inMemorySession) =>
    publishInMemorySessionMetadata(pubSub, inMemorySession)
  );
}

export function readSendInMemoryProfileMetadata(
  sessionId: string,
  profileId: string,
  pubSub: RedisPubSub
) {
  return readInMemoryProfile(sessionId, profileId).then((inMemoryProfile) =>
    publishInMemoryProfileMetadata(pubSub, sessionId, inMemoryProfile)
  );
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
          //TODO: Create interface for the states
          const state: Record<string, any> = {
            stages: {
              [InMemorySessionStage.WAITING]: [], // ids only because this is only for profile
              [InMemorySessionStage.START_EMOTION_CHECK]: [], // ids only because this is only for profile
              [InMemorySessionStage.TEAM_NAME]: [], // ids only because this is only for profile
              [InMemorySessionStage.ON_GOING]: [], // ids only because this only used when all activities are filled for all profiles
              [InMemorySessionStage.END_EMOTION_CHECK]: [], // ids only because this is only for profile
              [InMemorySessionStage.VIEW_RESULTS]: [], // ids only because this is only for profile (not sure that we need this)
            },
          };
          for (const activity of slot.workshop!.activities!) {
            state[activity.id] = []; // { profileId: string, questionId: string }[]
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
                groupCount: 2,
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

            let stateWithoutStagesString;
            if (!inMemoryProfile) {
              try {
                const { stages, ...stateWithoutStages } = JSON.parse(
                  session.state
                );
                stateWithoutStagesString = JSON.stringify(stateWithoutStages);
              } catch (e) {
                console.error(e);
                throw new Error(InMemorySessionError.SESSION_STATE_MALFORMED);
              }
            }
            const currentInMemoryProfile: InMemoryProfileMetadata =
              inMemoryProfile || {
                state: stateWithoutStagesString!,
                profileId,
                isActive: true,
                startEmotion: null,
                endEmotion: null,
                lastUpdateTimestamp: getUnixTime(new Date()),
              };

            return Promise.all([
              saveInMemorySession(
                currentInMemorySession.sessionId,
                currentInMemorySession
              ),
              saveInMemoryProfile(
                currentInMemorySession.sessionId,
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

export function updateInMemoryProfile(
  sessionId: string,
  profileId: string,
  updateFunction: (
    inMemoryProfile: InMemoryProfileMetadata
  ) => InMemoryProfileMetadata
) {
  const handleRequestTimestamp = getUnixTime(new Date());
  return readInMemoryProfile(sessionId, profileId).then((inMemoryProfile) => {
    if (handleRequestTimestamp < inMemoryProfile.lastUpdateTimestamp) {
      throw new ErrorWithData(
        InMemoryProfileMetadataError.PROFILE_OUTDATED,
        inMemoryProfile
      );
    }
    inMemoryProfile = updateFunction(inMemoryProfile);
    return saveInMemoryProfile(sessionId, inMemoryProfile);
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
      startEmotion: null,
      endEmotion: null,
      lastUpdateTimestamp: getUnixTime(new Date()),
    };
  } else {
    throw new Error(InMemorySessionError.SESSION_ALREADY_STARTED);
  }
  return Promise.all([
    saveInMemorySession(inMemorySession.sessionId, inMemorySession),
    saveInMemoryProfile(inMemorySession.sessionId, inMemoryProfile),
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
    saveInMemoryProfile(inMemorySession.sessionId, inMemoryProfile),
    saveInMemorySession(inMemorySession.sessionId, inMemorySession),
  ]).then(([inMemoryProfileMetadata, inMemorySession]) => {
    publishInMemoryProfileMetadata(
      pubSub,
      inMemorySession.sessionId,
      inMemoryProfileMetadata
    );
    publishInMemorySessionMetadata(pubSub, inMemorySession);
  });
}
