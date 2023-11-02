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

export function setupSessionAndProfileMetadataInMemoryStates(
  sessionId: string,
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
      });

      ops[0] = saveInMemorySessionMetadataState(sessionState);
    }
    if (!profileMetadataState) {
      const profileState = createProfileReducerInitialState({
        sessionId: sessionId,
        profileIds: participantProfileIds,
        activityIds: activityIds,
      });

      ops[1] = saveInMemoryProfileMetadataState(profileState);
    }
    return Promise.all(ops) as Promise<
      [InMemorySessionMetadataState, InMemoryProfileMetadataState]
    >;
  });
}

export function createInMemoryDispatcher(sessionId: string) {
  return Promise.all([
    readInMemorySessionMetadataState(sessionId),
    readInMemoryProfileMetadataState(sessionId),
  ]).then(([sessionMetadataState, profileMetadataState]) => {
    const sessionState = createSessionReducerInitialState({
      sessionId: sessionId,
      participantProfileIds: sessionMetadataState.participantProfileIds,
      activityIds: sessionMetadataState.activityIds,
      teamName: sessionMetadataState.teamName,
      stages: sessionMetadataState.stages,
      activityMap: sessionMetadataState.activityMap,
      lastUpdateTimestamp: sessionMetadataState.lastUpdateTimestamp,
    });
    const profileState = createProfileReducerInitialState({
      sessionId: sessionId,
      profileIds: sessionMetadataState.participantProfileIds,
      activityIds: profileMetadataState.activityIds,
      activityMap: profileMetadataState.activityMap,
      startEmotions: profileMetadataState.startEmotions,
      endEmotions: profileMetadataState.endEmotions,
      lastUpdateTimestamp: profileMetadataState.lastUpdateTimestamp,
    });
    const sessionReducer = getSessionReducer(sessionState);
    const profileReducer = getProfileReducer(profileState);

    type AllActions =
      | Parameters<typeof sessionReducer>["0"]
      | Parameters<typeof profileReducer>["0"];
    return function dispatcher(action: AllActions) {
      const updatedSessionState = sessionReducer(action);
      const updatedProfileState = profileReducer(action);

      return Promise.all([
        saveInMemorySessionMetadataState(updatedSessionState),
        saveInMemoryProfileMetadataState(updatedProfileState),
      ]);
    };
  });
}
