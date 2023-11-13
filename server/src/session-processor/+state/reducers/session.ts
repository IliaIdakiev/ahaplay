import { getNextStage } from "../helpers/get-next-stage";
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
  setActivityMode,
  setGroupActivityValue,
  setTeamName,
  startEmotionReady,
  teamNameReady,
} from "../actions";
import { createReducer, on } from "../utils/reducer-creator";
import {
  InMemorySessionStage,
  ActivityEntry,
  ActivityMode,
  ActivityType,
} from "../types";
import { getUnixTime } from "date-fns";
import { diff } from "deep-diff";
import { RemoveUnion } from "../../../types";

export interface InMemorySessionMetadataState {
  // INFO:
  // stages: { [InMemorySessionStage]: profileIds[] }
  // activities: { [activityId]: { profileId: string, value: string, ready: boolean }[] }
  readonly sessionId: string;
  readonly participantProfileIds: string[]; // Who is actually participating
  readonly profileIds: string[]; // All profiles that can access the workshop
  readonly connectedProfileIds: string[]; // All profiles that are connected
  readonly teamName: string | null;
  readonly currentStage: InMemorySessionStage;
  readonly activities: { id: string; type: ActivityType }[];
  readonly activityMode: ActivityMode;
  readonly stages: {
    [InMemorySessionStage.WAITING]: string[];
    [InMemorySessionStage.START_EMOTION_CHECK]: string[];
    [InMemorySessionStage.TEAM_NAME]: string[];
    [InMemorySessionStage.ON_GOING]: string[];
    [InMemorySessionStage.END_EMOTION_CHECK]: string[];
    [InMemorySessionStage.VIEW_RESULTS]: string[];
  };
  readonly activityMap: Record<string, ActivityEntry[]>;
  readonly currentGroupActivityId: string | null; // TODO: rename to current group activity? also needs fixing because always showing null
  readonly allActivitiesFinished: boolean; // this also for some reason is returned as true
  readonly lastUpdateTimestamp: number | null;
}

export function createSessionReducerInitialState({
  sessionId,
  activities,
  teamName,
  stages,
  activityMap,
  lastUpdateTimestamp,
  profileIds,
  connectedProfileIds,
  participantProfileIds,
  activityMode,
}: {
  sessionId: string;
  activities: { id: string; type: ActivityType }[];
  profileIds: string[]; // All profiles that can access the workshop
  participantProfileIds: string[]; // Who is actually participating
  connectedProfileIds: string[]; // All profiles that are connected
  teamName?: string | null;
  stages?: InMemorySessionMetadataState["stages"];
  activityMap?: InMemorySessionMetadataState["activityMap"];
  lastUpdateTimestamp?: number | null;
  activityMode: ActivityMode;
}) {
  let currentStage = InMemorySessionStage.WAITING;
  let currentActivityId = activities[0].id;

  if (activityMap) {
    let counter = -1;
    for (const { id: activityId } of activities) {
      counter = counter + 1;
      const isActivityReady = activityMap[activityId].every((a) => a.ready);
      if (!isActivityReady) {
        break;
      }
    }
    currentActivityId = activities[counter].id;
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
    activities.reduce(
      (acc, { id: activityId }) => ({ ...acc, [activityId]: [] }),
      {}
    );

  const isCurrentActivityReady =
    activityMap[currentActivityId].length === participantProfileIds.length &&
    activityMap[currentActivityId].every((a) => a.ready);

  activityMode =
    isCurrentActivityReady && activityMode === ActivityMode.GROUP
      ? ActivityMode.PROFILE
      : ActivityMode.GROUP;
  const currentActivityIndex = activities.findIndex(
    (a) => a.id === currentActivityId
  );
  const nextActivityIndex = currentActivityIndex + 1;
  const allActivitiesFinished =
    isCurrentActivityReady && nextActivityIndex === activities.length;

  if (allActivitiesFinished && currentStage === InMemorySessionStage.ON_GOING) {
    stages![InMemorySessionStage.ON_GOING] = participantProfileIds.slice();
    currentStage = InMemorySessionStage.END_EMOTION_CHECK;
  }
  const initialState: InMemorySessionMetadataState = {
    sessionId,
    participantProfileIds,
    connectedProfileIds,
    profileIds,
    activities,
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
    activityMode,
    currentGroupActivityId: allActivitiesFinished ? null : currentActivityId,
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
    on(setActivityMode, (state, { activityMode }) => {
      return { ...state, activityMode };
    }),
    on(addConnectedProfile, (state, { profileIds: ids }) => {
      return {
        ...state,
        connectedProfileIds: Array.from(
          new Set(state.connectedProfileIds.concat(ids))
        ),
      };
    }),
    on(removeConnectedProfile, (state, { profileIds: ids }) => {
      const idArray = ([] as string[]).concat(ids);
      return {
        ...state,
        connectedProfileIds: state.connectedProfileIds.filter(
          (val) => !idArray.includes(val)
        ),
      };
    }),
    on(addParticipant, (state, { profileIds: ids }) => {
      if (state.currentStage !== InMemorySessionStage.WAITING) {
        return state;
      }
      return {
        ...state,
        participantProfileIds: state.participantProfileIds.concat(ids),
      };
    }),
    on(removeParticipant, (state, { profileIds: ids }) => {
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
      if (state.currentStage !== InMemorySessionStage.WAITING) {
        return state;
      }
      return applyStageReadyForProfile(
        state,
        InMemorySessionStage.WAITING,
        profileId
      );
    }),
    on(setTeamName, (state, { teamName }) => {
      if (state.currentStage !== InMemorySessionStage.TEAM_NAME) {
        return state;
      }
      return { ...state, teamName };
    }),
    on(teamNameReady, (state, { profileId }) => {
      if (state.currentStage !== InMemorySessionStage.TEAM_NAME) {
        return state;
      }
      return applyStageReadyForProfile(
        state,
        InMemorySessionStage.TEAM_NAME,
        profileId
      );
    }),
    on(startEmotionReady, (state, { profileId }) => {
      if (state.currentStage !== InMemorySessionStage.START_EMOTION_CHECK) {
        return state;
      }
      return applyStageReadyForProfile(
        state,
        InMemorySessionStage.START_EMOTION_CHECK,
        profileId
      );
    }),
    on(endEmotionReady, (state, { profileId }) => {
      if (state.currentStage !== InMemorySessionStage.END_EMOTION_CHECK) {
        return state;
      }
      return applyStageReadyForProfile(
        state,
        InMemorySessionStage.END_EMOTION_CHECK,
        profileId
      );
    }),
    on(finish, (state) => {
      if (state.currentStage !== InMemorySessionStage.VIEW_RESULTS) {
        return state;
      }
      return {
        ...state,
        stages: {
          ...state.stages,
          [InMemorySessionStage.VIEW_RESULTS]:
            state.stages[InMemorySessionStage.END_EMOTION_CHECK].slice(),
        },
      };
    }),
    on(setGroupActivityValue, (state, { profileId, value, activityId }) => {
      if (
        activityId !== state.currentGroupActivityId ||
        state.currentStage !== InMemorySessionStage.ON_GOING ||
        state.activityMode !== ActivityMode.GROUP
      ) {
        return state;
      }
      const { activityMap: activities } = state;
      const valueForCurrentActivity = activities[state.currentGroupActivityId!];
      return {
        ...state,
        activityMap: {
          ...activities,
          [state.currentGroupActivityId!]: valueForCurrentActivity
            .filter(({ profileId: pId }) => profileId !== pId)
            .concat([{ profileId, value, ready: false }]),
        },
      };
    }),
    on(groupActivityReady, (state, { profileId, activityId }) => {
      if (
        activityId !== state.currentGroupActivityId ||
        state.currentStage !== InMemorySessionStage.ON_GOING ||
        state.activityMode !== ActivityMode.GROUP
      ) {
        return state;
      }
      const { activityMap: activities } = state;
      const valuesForCurrentActivity =
        activities[state.currentGroupActivityId!];
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

      let currentActivityId = state.currentGroupActivityId;
      let allActivitiesFinished = state.allActivitiesFinished;
      let activityMode = ActivityMode.GROUP;
      if (updatedValuesForCurrentActivity.every((a) => a.ready)) {
        activityMode = ActivityMode.PROFILE;
        const currentActivityIndex = state.activities.findIndex(
          (a) => a.id === currentActivityId
        );
        const nextActivityId = currentActivityIndex + 1;
        if (nextActivityId < state.activities.length) {
          currentActivityId = state.activities[nextActivityId].id;
        } else {
          allActivitiesFinished = true;
        }
      }

      return {
        ...state,
        activityMode,
        activityMap: {
          ...activities,
          [state.currentGroupActivityId!]: updatedValuesForCurrentActivity,
        },
        currentGroupActivityId: currentActivityId,
        allActivitiesFinished,
      };
    }),
    on(addGroupActivityEntry, (state, { entry, forceUpdate, activityId }) => {
      if (
        activityId !== state.currentGroupActivityId ||
        state.currentStage !== InMemorySessionStage.ON_GOING ||
        state.activityMode !== ActivityMode.GROUP
      ) {
        return state;
      }
      let currentActivity = state.activityMap[state.currentGroupActivityId!];
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
        [state.currentGroupActivityId!]: updatedCurrentActivity,
      };

      let currentActivityId = state.currentGroupActivityId;
      let allActivitiesFinished = state.allActivitiesFinished;
      if (updatedCurrentActivity.every((a) => a.ready)) {
        const currentActivityIndex = state.activities.findIndex(
          (a) => a.id === currentActivityId
        );
        const nextActivityId = currentActivityIndex + 1;
        if (nextActivityId < state.activities.length) {
          currentActivityId = state.activities[nextActivityId].id;
        } else {
          allActivitiesFinished = true;
        }
      }

      return {
        ...state,
        activityMap: updatedActivityMap,
        currentGroupActivityId: currentActivityId,
        allActivitiesFinished,
      };
    })
  );
  type Action = Parameters<typeof reducer>[1];
  type State = Parameters<typeof reducer>[0];
  return function dispatchAction(
    action: Action,
    ...other:
      | []
      | [RemoveUnion<State, undefined>]
      | [...Action[], RemoveUnion<State, undefined>]
  ) {
    const additionalActions = other.filter((a) => "type" in a) as Action[];
    const providedState: State | null =
      other.length > 0 && additionalActions.length < other.length
        ? (other[other.length - 1] as State)
        : null;

    const _initialState = providedState || initialState;
    const stateAfterActions = [action]
      .concat(additionalActions)
      .reduce((state, action) => {
        return reducer(state, action);
      }, _initialState);

    const differences = diff(_initialState, stateAfterActions);
    const hasStateChanged = !!differences;
    return { state: stateAfterActions, hasStateChanged, differences };
  };
}
