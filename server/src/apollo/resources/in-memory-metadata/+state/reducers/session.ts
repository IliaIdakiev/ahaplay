import { getNextStage } from "../helpers";
import {
  addConnectedProfile,
  addGroupActivityEntry,
  addParticipant,
  endEmotionReady,
  finish,
  groupActivityReady,
  readyToStart,
  removeConnectedProfile,
  removeParticipant,
  setGroupActivityValue,
  setTeamName,
  startEmotionReady,
  teamNameReady,
} from "../actions";
import { createReducer, on } from "../utils/reducer-creator";
import { ActivityEntry } from "../types";
import { InMemorySessionStage } from "../../../../types";
import { getUnixTime } from "date-fns";
import { isEqual } from "lodash";

export interface InMemorySessionMetadataState {
  // INFO:
  // stages: { [InMemorySessionStage]: profileIds[] }
  // activities: { [activityId]: { profileId: string, questionId: string, ready: boolean } }
  readonly sessionId: string;
  readonly participantProfileIds: string[]; // Who is actually participating
  readonly profileIds: string[]; // All profiles that can access the workshop
  readonly connectedProfileIds: string[]; // All profiles that are connected
  readonly teamName: string | null;
  readonly currentStage: InMemorySessionStage;
  readonly activityIds: string[];
  readonly stages: {
    [InMemorySessionStage.WAITING]: string[];
    [InMemorySessionStage.START_EMOTION_CHECK]: string[];
    [InMemorySessionStage.TEAM_NAME]: string[];
    [InMemorySessionStage.ON_GOING]: string[];
    [InMemorySessionStage.END_EMOTION_CHECK]: string[];
    [InMemorySessionStage.VIEW_RESULTS]: string[];
  };
  readonly activityMap: Record<string, ActivityEntry[]>;
  readonly currentActivityId: string | null;
  readonly allActivitiesFinished: boolean;
  readonly lastUpdateTimestamp: number | null;
}

export function createSessionReducerInitialState({
  sessionId,
  activityIds,
  teamName,
  stages,
  activityMap,
  lastUpdateTimestamp,
  profileIds,
  connectedProfileIds,
  participantProfileIds,
}: {
  sessionId: string;
  activityIds: string[];
  profileIds: string[]; // All profiles that can access the workshop
  participantProfileIds: string[]; // Who is actually participating
  connectedProfileIds: string[]; // All profiles that are connected
  teamName?: string | null;
  stages?: InMemorySessionMetadataState["stages"];
  activityMap?: InMemorySessionMetadataState["activityMap"];
  lastUpdateTimestamp?: number | null;
}) {
  let currentStage = InMemorySessionStage.WAITING;
  let currentActivityId = activityIds[0];

  if (activityMap) {
    let counter = -1;
    for (const activityId of activityIds) {
      counter = counter + 1;
      const isActivityReady = activityMap[activityId].every((a) => a.ready);
      if (!isActivityReady) {
        break;
      }
    }
    currentActivityId = activityIds[counter];
  }
  if (stages) {
    let stageKey = InMemorySessionStage.WAITING;
    for (const [currentStageKey, currentStageValues] of Object.entries(
      stages
    )) {
      stageKey = currentStageKey as InMemorySessionStage;
      const isStageReady =
        currentStageValues.length === participantProfileIds.length;
      if (!isStageReady) {
        break;
      }
    }
    currentStage = stageKey;
  }

  activityMap =
    activityMap ||
    activityIds.reduce((acc, activityId) => ({ ...acc, [activityId]: [] }), {});

  const isCurrentActivityReady = activityMap[currentActivityId].every(
    (a) => a.ready
  );
  const currentActivityIndex = activityIds.indexOf(currentActivityId);
  const nextActivityIndex = currentActivityIndex + 1;
  const allActivitiesFinished =
    isCurrentActivityReady && nextActivityIndex === activityIds.length;

  if (allActivitiesFinished && currentStage === InMemorySessionStage.ON_GOING) {
    stages![InMemorySessionStage.ON_GOING] = participantProfileIds.slice();
    currentStage = InMemorySessionStage.END_EMOTION_CHECK;
  }
  const initialState: InMemorySessionMetadataState = {
    sessionId,
    participantProfileIds,
    connectedProfileIds,
    profileIds,
    activityIds,
    teamName: teamName || null,
    currentStage: currentStage || InMemorySessionStage.WAITING,
    stages: stages || {
      [InMemorySessionStage.WAITING]: [],
      [InMemorySessionStage.START_EMOTION_CHECK]: [],
      [InMemorySessionStage.TEAM_NAME]: [],
      [InMemorySessionStage.ON_GOING]: [],
      [InMemorySessionStage.END_EMOTION_CHECK]: [],
      [InMemorySessionStage.VIEW_RESULTS]: [],
    },
    activityMap,
    currentActivityId: allActivitiesFinished ? null : currentActivityId,
    allActivitiesFinished,
    lastUpdateTimestamp: lastUpdateTimestamp || getUnixTime(new Date()),
  };
  return initialState;
}

function applyStageReadyForProfile(
  state: InMemorySessionMetadataState,
  stage: InMemorySessionStage,
  profileId: string
) {
  const currentStages = state.stages;
  if (currentStages[stage].includes(profileId)) {
    return state;
  }
  const stages = {
    ...currentStages,
    [stage]: currentStages[stage].concat(profileId),
  };

  let updatedState = { ...state, stages };

  if (
    updatedState.stages[stage].length === state.participantProfileIds.length
  ) {
    updatedState = {
      ...updatedState,
      currentStage: getNextStage(state.currentStage),
    };
  }

  return updatedState;
}

export function getSessionReducer(initialState: InMemorySessionMetadataState) {
  const reducer = createReducer(
    initialState,
    on(addConnectedProfile, (state, { ids }) => {
      return {
        ...state,
        connectedProfileIds: Array.from(
          new Set(state.connectedProfileIds.concat(ids))
        ),
      };
    }),
    on(removeConnectedProfile, (state, { ids }) => {
      const idArray = ([] as string[]).concat(ids);
      return {
        ...state,
        connectedProfileIds: state.connectedProfileIds.filter(
          (val) => !idArray.includes(val)
        ),
      };
    }),
    on(addParticipant, (state, { ids }) => {
      if (state.currentStage !== InMemorySessionStage.WAITING) {
        return state;
      }
      return {
        ...state,
        participantProfileIds: state.participantProfileIds.concat(ids),
      };
    }),
    on(removeParticipant, (state, { ids }) => {
      if (state.currentStage !== InMemorySessionStage.WAITING) {
        return state;
      }
      return {
        ...state,
        participantProfileIds: state.participantProfileIds.filter(
          (id) => !ids.includes(id)
        ),
      };
    }),
    on(readyToStart, (state, { profileId }) => {
      return applyStageReadyForProfile(
        state,
        InMemorySessionStage.WAITING,
        profileId
      );
    }),
    on(setTeamName, (state, { teamName }) => {
      return { ...state, teamName };
    }),
    on(teamNameReady, (state, { profileId }) => {
      return applyStageReadyForProfile(
        state,
        InMemorySessionStage.TEAM_NAME,
        profileId
      );
    }),
    on(startEmotionReady, (state, { profileId }) => {
      return applyStageReadyForProfile(
        state,
        InMemorySessionStage.START_EMOTION_CHECK,
        profileId
      );
    }),
    on(endEmotionReady, (state, { profileId }) => {
      return applyStageReadyForProfile(
        state,
        InMemorySessionStage.END_EMOTION_CHECK,
        profileId
      );
    }),
    on(finish, (state) => {
      return {
        ...state,
        stages: {
          ...state.stages,
          [InMemorySessionStage.VIEW_RESULTS]:
            state.stages[InMemorySessionStage.END_EMOTION_CHECK].slice(),
        },
      };
    }),
    on(setGroupActivityValue, (state, { profileId, questionId }) => {
      const { activityMap: activities } = state;
      const valueForCurrentActivity = activities[state.currentActivityId!];
      return {
        ...state,
        activityMap: {
          ...activities,
          [state.currentActivityId!]: valueForCurrentActivity
            .filter(({ profileId: pId }) => profileId !== pId)
            .concat([{ profileId, questionId, ready: false }]),
        },
      };
    }),
    on(groupActivityReady, (state, { profileId }) => {
      const { activityMap: activities } = state;
      const valuesForCurrentActivity = activities[state.currentActivityId!];
      const valueForCurrentActivityIndex = valuesForCurrentActivity.findIndex(
        ({ profileId: pId }) => pId === profileId
      );
      if (valueForCurrentActivityIndex === -1) {
        return state;
      }
      const updatedValuesForCurrentActivity = [
        ...valuesForCurrentActivity.slice(0, valueForCurrentActivityIndex),
        {
          ...valuesForCurrentActivity[valueForCurrentActivityIndex],
          ready: true,
        },
        ...valuesForCurrentActivity.slice(valueForCurrentActivityIndex + 1),
      ];

      let currentActivityId = state.currentActivityId;
      let allActivitiesFinished = state.allActivitiesFinished;
      if (updatedValuesForCurrentActivity.every((a) => a.ready)) {
        const currentActivityIndex = state.activityIds.indexOf(
          currentActivityId!
        );
        const nextActivityId = currentActivityIndex + 1;
        if (nextActivityId < state.activityIds.length) {
          currentActivityId = state.activityIds[nextActivityId];
        } else {
          allActivitiesFinished = true;
        }
      }

      return {
        ...state,
        activityMap: {
          ...activities,
          [state.currentActivityId!]: updatedValuesForCurrentActivity,
        },
        currentActivityId,
        allActivitiesFinished,
      };
    }),
    on(addGroupActivityEntry, (state, { entry, forceUpdate }) => {
      let currentActivity = state.activityMap[state.currentActivityId!];
      const alreadyExistingActivity = currentActivity.find(
        (a) => a.profileId === entry.profileId
      );
      if (alreadyExistingActivity && forceUpdate) {
        const alreadyExistingActivityIndex = currentActivity.indexOf(
          alreadyExistingActivity
        );
        currentActivity = [
          ...currentActivity.slice(0, alreadyExistingActivityIndex),
          ...currentActivity.slice(alreadyExistingActivityIndex + 1),
        ];
      } else if (alreadyExistingActivity) {
        return state;
      }

      const notReadyEntry: ActivityEntry = {
        ...entry,
        ready: false,
      };

      const updatedCurrentActivity = currentActivity.concat(notReadyEntry);

      const updatedActivityMap = {
        ...state.activityMap,
        [state.currentActivityId!]: updatedCurrentActivity,
      };

      let currentActivityId = state.currentActivityId;
      let allActivitiesFinished = state.allActivitiesFinished;
      if (updatedCurrentActivity.every((a) => a.ready)) {
        const currentActivityIndex = state.activityIds.indexOf(
          currentActivityId!
        );
        const nextActivityId = currentActivityIndex + 1;
        if (nextActivityId < state.activityIds.length) {
          currentActivityId = state.activityIds[nextActivityId];
        } else {
          allActivitiesFinished = true;
        }
      }

      return {
        ...state,
        activityMap: updatedActivityMap,
        currentActivityId,
        allActivitiesFinished,
      };
    })
  );
  type Action = Parameters<typeof reducer>[1];
  type State = Parameters<typeof reducer>[0];
  return function dispatchAction(action: Action, currentState?: State) {
    const _initialState = currentState || initialState;
    const stateAfterAction = reducer(_initialState, action);
    const hasStateChanged = !isEqual(_initialState, stateAfterAction);
    return { state: stateAfterAction, hasStateChanged };
  };
}
