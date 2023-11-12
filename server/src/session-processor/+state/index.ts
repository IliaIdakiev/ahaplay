import {
  InMemoryProfileMetadataState,
  InMemorySessionMetadataState,
  createProfileReducerInitialState,
  createSessionReducerInitialState,
  getProfileReducer,
  getSessionReducer,
} from "./reducers";
import * as actions from "./actions";
import {
  readInMemoryProfileMetadataState,
  readInMemorySessionMetadataState,
  saveInMemoryProfileMetadataState,
  saveInMemorySessionMetadataState,
} from "./helpers/redis";
import { ActivityMode } from "./types";

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
    let sessionState = sessionMetadataState;
    let ops = [
      Promise.resolve(sessionMetadataState),
      Promise.resolve(profileMetadataState),
    ];
    if (!sessionMetadataState) {
      sessionState = createSessionReducerInitialState({
        sessionId: sessionId,
        participantProfileIds: participantProfileIds,
        activityIds: activityIds,
        profileIds,
        connectedProfileIds,
        activityMode: ActivityMode.PROFILE,
      });

      ops[0] = saveInMemorySessionMetadataState(sessionState);
    }
    if (!profileMetadataState) {
      const profileState = createProfileReducerInitialState({
        sessionId: sessionId,
        participantProfileIds: participantProfileIds,
        activityIds: activityIds,
        sessionStage: sessionState!.currentStage,
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
      activityMode: sessionMetadataState.activityMode,
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
      sessionStage: sessionState.currentStage,
    });
    const sessionReducer = getSessionReducer(sessionState);
    const profileReducer = getProfileReducer(profileState);

    return function dispatcher(action: InMemoryMetadataActions) {
      let sessionResult = sessionReducer(action);
      let profileResult = profileReducer(action);

      const hasSessionActivityModeChanged = sessionResult.differences?.find(
        (d) => d.path?.includes("activityMode")
      );
      const hasProfileActivityModeChanged = profileResult.differences?.find(
        (d) => d.path?.includes("activityMode")
      );

      if (
        hasSessionActivityModeChanged &&
        profileResult.state.activityMode !== sessionResult.state.activityMode
      ) {
        profileResult = profileReducer(
          actions.setActivityMode({
            activityMode: sessionResult.state.activityMode,
          }),
          profileResult.state
        );
      }

      if (
        hasProfileActivityModeChanged &&
        profileResult.state.activityMode !== sessionResult.state.activityMode
      ) {
        sessionResult = sessionReducer(
          actions.setActivityMode({
            activityMode: profileResult.state.activityMode,
          }),
          sessionResult.state
        );
      }

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
