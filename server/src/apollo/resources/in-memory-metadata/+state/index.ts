import {
  readInMemoryProfileMetadataState,
  readInMemorySessionMetadataState,
  saveInMemoryProfileMetadataState,
  saveInMemorySessionMetadataState,
} from "../helpers";
import {
  InMemoryProfileMetadataState,
  InMemorySessionMetadataState,
  createProfileReducerInitialState,
  createSessionReducerInitialState,
  getProfileReducer,
  getSessionReducer,
} from "./reducers";
import * as actions from "./actions";

export function setupSessionAndProfileMetadataInMemoryStates(
  sessionId: string,
  profileIds: string[],
  connectedProfileIds: string[],
  participantProfileIds: string[],
  activityIds: string[]
) {
  return Promise.all([
    readInMemorySessionMetadataState(sessionId, true),
    readInMemoryProfileMetadataState(sessionId, true),
  ]).then(([sessionMetadataState, profileMetadataState]) => {
    let ops = [
      Promise.resolve(sessionMetadataState),
      Promise.resolve(profileMetadataState),
    ];
    if (!sessionMetadataState) {
      const sessionState = createSessionReducerInitialState({
        sessionId: sessionId,
        participantProfileIds: participantProfileIds,
        activityIds: activityIds,
        profileIds,
        connectedProfileIds,
      });

      ops[0] = saveInMemorySessionMetadataState(sessionState);
    }
    if (!profileMetadataState) {
      const profileState = createProfileReducerInitialState({
        sessionId: sessionId,
        participantProfileIds: participantProfileIds,
        activityIds: activityIds,
      });

      ops[1] = saveInMemoryProfileMetadataState(profileState);
    }
    return Promise.all(ops) as Promise<
      [InMemorySessionMetadataState, InMemoryProfileMetadataState]
    >;
  });
}

export function createInMemoryDispatcher(
  sessionId: string,
  config?: { allowNullProfile: boolean }
) {
  return Promise.all([
    readInMemorySessionMetadataState(sessionId),
    readInMemoryProfileMetadataState(
      sessionId,
      config?.allowNullProfile || false
    ),
  ]).then(([sessionMetadataState, profileMetadataState]) => {
    const sessionState = createSessionReducerInitialState({
      sessionId: sessionId,
      participantProfileIds: sessionMetadataState.participantProfileIds,
      activityIds: sessionMetadataState.activityIds,
      teamName: sessionMetadataState.teamName,
      stages: sessionMetadataState.stages,
      activityMap: sessionMetadataState.activityMap,
      lastUpdateTimestamp: sessionMetadataState.lastUpdateTimestamp,
      profileIds: sessionMetadataState.profileIds,
      connectedProfileIds: sessionMetadataState.connectedProfileIds,
    });
    const profileState = createProfileReducerInitialState({
      sessionId: sessionId,
      participantProfileIds: sessionMetadataState.participantProfileIds,
      activityIds:
        profileMetadataState?.activityIds || sessionMetadataState.activityIds,
      activityMap: profileMetadataState?.activityMap,
      startEmotions: profileMetadataState?.startEmotions,
      endEmotions: profileMetadataState?.endEmotions,
      lastUpdateTimestamp: profileMetadataState?.lastUpdateTimestamp,
    });
    const sessionReducer = getSessionReducer(sessionState);
    const profileReducer = getProfileReducer(profileState);

    type AllActions =
      | Parameters<ReturnType<typeof getSessionReducer>>["0"]
      | Parameters<ReturnType<typeof getProfileReducer>>["0"];
    return function dispatcher(action: AllActions) {
      const sessionResult = sessionReducer(action);
      const profileResult = profileReducer(action);

      return Promise.all([
        sessionResult.hasStateChanged
          ? saveInMemorySessionMetadataState(sessionResult.state).then(
              (state) => ({ state, hasStateChanged: true })
            )
          : sessionResult,
        profileResult.hasStateChanged
          ? saveInMemoryProfileMetadataState(profileResult.state).then(
              (state) => ({ state, hasStateChanged: true })
            )
          : profileResult,
      ] as const);
    };
  });
}

export type InMemoryMetadataActions = ReturnType<
  (typeof actions)[keyof typeof actions]
>;
