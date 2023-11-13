import { getUnixTime } from "date-fns";
import {
  addParticipant,
  profileActivityReady,
  removeParticipant,
  setActivityMode,
  setEndEmotion,
  setProfileActivityValue,
  setStartEmotion,
} from "../actions";
import {
  ActivityEntry,
  ActivityMode,
  ActivityType,
  InMemorySessionStage,
} from "../types";
import { createReducer, on } from "../utils/reducer-creator";
import { diff } from "deep-diff";
import { RemoveUnion } from "../../../types";

export interface InMemoryProfileMetadataState {
  // INFO:
  // activities: { [activityId]: { profileId: string, value: string }[] }
  readonly sessionId: string;
  readonly activities: { id: string; type: ActivityType }[];
  readonly activityMap: Record<string, ActivityEntry[]>;
  readonly activityMode: ActivityMode;
  readonly currentProfileActivityId: string | null;
  readonly sessionStage: InMemorySessionStage;
  readonly finished: boolean;
  readonly startEmotions: { emotion: number; profileId: string }[];
  readonly endEmotions: { emotion: number; profileId: string }[];
  readonly lastUpdateTimestamp: number | null;
}

export function createProfileReducerInitialState({
  sessionId,
  participantProfileIds,
  activities,
  activityMap,
  startEmotions,
  endEmotions,
  lastUpdateTimestamp,
  sessionStage,
}: {
  sessionId: string;
  participantProfileIds: string[];
  activities: { id: string; type: ActivityType }[];
  activityMap?: InMemoryProfileMetadataState["activityMap"];
  startEmotions?: { emotion: number; profileId: string }[];
  endEmotions?: { emotion: number; profileId: string }[];
  lastUpdateTimestamp?: number | null;
  sessionStage: InMemorySessionStage;
}) {
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

  activityMap =
    activityMap ||
    activities.reduce(
      (acc, { id: activityId }) => ({
        ...acc,
        [activityId]: participantProfileIds.map((profileId) => ({
          profileId,
          value: null,
          ready: false,
        })),
      }),
      {}
    );

  const currentActivityIndex = activities.findIndex(
    (a) => a.id === currentActivityId
  );
  const nextActivityIndex = currentActivityIndex + 1;
  const nextActivity = activities[nextActivityIndex];
  const finished = !!(
    !nextActivity && activityMap[currentActivityId].every((a) => a.ready)
  );

  const initialState: InMemoryProfileMetadataState = {
    sessionId,
    currentProfileActivityId: currentActivityId,
    activities,
    activityMap,
    finished,
    activityMode: ActivityMode.PROFILE,
    startEmotions: startEmotions || [],
    endEmotions: endEmotions || [],
    lastUpdateTimestamp: lastUpdateTimestamp || getUnixTime(new Date()),
    sessionStage,
  };
  return initialState;
}

export function getProfileReducer(initialState: InMemoryProfileMetadataState) {
  const reducer = createReducer(
    initialState,
    on(setActivityMode, (state, { activityMode }) => {
      return { ...state, activityMode };
    }),
    on(addParticipant, (state, { profileIds: ids }) => {
      const { activities, activityMap } = state;
      const idArray = ([] as string[]).concat(ids);
      const updatedActivities: Record<string, ActivityEntry[]> = {};
      for (const { id: activityId } of activities) {
        updatedActivities[activityId] = [...activityMap[activityId]];
        for (const id of idArray) {
          updatedActivities[activityId] = [
            ...updatedActivities[activityId],
            { profileId: id, value: null, ready: false },
          ];
        }
      }
      return { ...state, activityMap: updatedActivities };
    }),
    on(removeParticipant, (state, { profileIds: ids }) => {
      const { activities, activityMap } = state;
      const idArray = ([] as string[]).concat(ids);
      const updatedActivities: Record<string, ActivityEntry[]> = {};
      for (const { id: activityId } of activities) {
        updatedActivities[activityId] = [...activityMap[activityId]];
        for (const id of idArray) {
          updatedActivities[activityId] = updatedActivities[activityId].filter(
            (p) => p.profileId !== id
          );
        }
      }
      return { ...state, activityMap: updatedActivities };
    }),
    on(setProfileActivityValue, (state, { profileId, value, activityId }) => {
      if (
        activityId !== state.currentProfileActivityId ||
        state.sessionStage !== InMemorySessionStage.ON_GOING ||
        state.activityMode !== ActivityMode.PROFILE
      ) {
        return state;
      }
      const { activityMap: activities } = state;
      const valueForCurrentActivity =
        activities[state.currentProfileActivityId!];
      return {
        ...state,
        activityMap: {
          ...activities,
          [state.currentProfileActivityId!]: valueForCurrentActivity
            .filter(({ profileId: pId }) => profileId !== pId)
            .concat([{ profileId, value, ready: false }]),
        },
        lastUpdateTimestamp: getUnixTime(new Date()),
      };
    }),
    on(profileActivityReady, (state, { profileId, activityId }) => {
      if (
        activityId !== state.currentProfileActivityId ||
        state.sessionStage !== InMemorySessionStage.ON_GOING ||
        state.activityMode !== ActivityMode.PROFILE
      ) {
        return state;
      }
      const { activityMap: activities } = state;
      const valuesForCurrentActivity =
        activities[state.currentProfileActivityId!];
      if (
        !valuesForCurrentActivity.find((a) => a.profileId === profileId)?.value
      ) {
        return state;
      }
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

      const isCurrentActivityReady = updatedValuesForCurrentActivity.every(
        (a) => a.ready
      );

      let currentActivityId: string | null = state.currentProfileActivityId;
      let finished = state.finished;
      let activityMode = isCurrentActivityReady
        ? ActivityMode.GROUP
        : ActivityMode.PROFILE;

      if (isCurrentActivityReady) {
        const currentActivityIndex = state.activities.findIndex(
          (a) => a.id === currentActivityId
        );
        const nextActivityIndex = currentActivityIndex + 1;
        currentActivityId =
          nextActivityIndex === state.activities.length
            ? null
            : state.activities[nextActivityIndex].id;
        finished = currentActivityId === null;
      }

      return {
        ...state,
        currentProfileActivityId: currentActivityId,
        finished,
        activityMode,
        lastUpdateTimestamp: getUnixTime(new Date()),
        activityMap: {
          ...activities,
          [state.currentProfileActivityId!]: updatedValuesForCurrentActivity,
        },
      };
    }),
    on(setStartEmotion, (state, { profileId, emotion }) => {
      if (state.sessionStage !== InMemorySessionStage.START_EMOTION_CHECK) {
        return state;
      }
      let { startEmotions } = state;
      startEmotions = startEmotions
        .filter((e) => e.profileId !== profileId)
        .concat({ profileId, emotion });
      return {
        ...state,
        lastUpdateTimestamp: getUnixTime(new Date()),
        startEmotions,
      };
    }),
    on(setEndEmotion, (state, { profileId, emotion }) => {
      if (state.sessionStage !== InMemorySessionStage.END_EMOTION_CHECK) {
        return state;
      }
      let { endEmotions } = state;
      endEmotions = endEmotions
        .filter((e) => e.profileId !== profileId)
        .concat({ profileId, emotion });
      return {
        ...state,
        lastUpdateTimestamp: getUnixTime(new Date()),
        endEmotions,
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
