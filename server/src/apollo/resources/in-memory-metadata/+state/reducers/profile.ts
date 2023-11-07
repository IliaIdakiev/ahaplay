import { getUnixTime } from "date-fns";
import {
  addParticipant,
  profileActivityReady,
  removeParticipant,
  setEndEmotion,
  setProfileActivityValue,
  setStartEmotion,
} from "../actions";
import { ActivityEntry } from "../types";
import { createReducer, on } from "../utils/reducer-creator";
import { isEqual } from "lodash";

export interface InMemoryProfileMetadataState {
  // INFO:
  // activities: { [activityId]: { profileId: string, value: string }[] }
  readonly sessionId: string;
  readonly activityIds: string[];
  readonly activityMap: Record<string, ActivityEntry[]>;
  readonly currentActivityId: string | null;
  readonly finished: boolean;
  readonly startEmotions: { emotion: number; profileId: string }[];
  readonly endEmotions: { emotion: number; profileId: string }[];
  readonly lastUpdateTimestamp: number | null;
}

export function createProfileReducerInitialState({
  sessionId,
  participantProfileIds,
  activityIds,
  activityMap,
  startEmotions,
  endEmotions,
  lastUpdateTimestamp,
}: {
  sessionId: string;
  participantProfileIds: string[];
  activityIds: string[];
  activityMap?: InMemoryProfileMetadataState["activityMap"];
  startEmotions?: { emotion: number; profileId: string }[];
  endEmotions?: { emotion: number; profileId: string }[];
  lastUpdateTimestamp?: number | null;
}) {
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

  activityMap =
    activityMap ||
    activityIds.reduce(
      (acc, activityId) => ({
        ...acc,
        [activityId]: participantProfileIds.map((profileId) => ({
          profileId,
          value: null,
          ready: false,
        })),
      }),
      {}
    );

  const currentActivityIndex = activityIds.indexOf(currentActivityId);
  const nextActivityIndex = currentActivityIndex + 1;
  const nextActivity = activityIds[nextActivityIndex];
  const finished = !!(
    !nextActivity && activityMap[currentActivityId].every((a) => a.ready)
  );

  const initialState: InMemoryProfileMetadataState = {
    sessionId,
    currentActivityId,
    activityIds,
    activityMap,
    finished,
    startEmotions: startEmotions || [],
    endEmotions: endEmotions || [],
    lastUpdateTimestamp: lastUpdateTimestamp || getUnixTime(new Date()),
  };
  return initialState;
}

export function getProfileReducer(initialState: InMemoryProfileMetadataState) {
  const reducer = createReducer(
    initialState,
    on(addParticipant, (state, { ids }) => {
      const { activityIds, activityMap } = state;
      const idArray = ([] as string[]).concat(ids);
      const updatedActivities: Record<string, ActivityEntry[]> = {};
      for (const activityId of activityIds) {
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
    on(removeParticipant, (state, { ids }) => {
      const { activityIds, activityMap } = state;
      const idArray = ([] as string[]).concat(ids);
      const updatedActivities: Record<string, ActivityEntry[]> = {};
      for (const activityId of activityIds) {
        updatedActivities[activityId] = [...activityMap[activityId]];
        for (const id of idArray) {
          updatedActivities[activityId] = updatedActivities[activityId].filter(
            (p) => p.profileId !== id
          );
        }
      }
      return { ...state, activityMap: updatedActivities };
    }),
    on(setProfileActivityValue, (state, { profileId, value }) => {
      const { activityMap: activities } = state;
      const valueForCurrentActivity = activities[state.currentActivityId!];
      return {
        ...state,
        activityMap: {
          ...activities,
          [state.currentActivityId!]: valueForCurrentActivity
            .filter(({ profileId: pId }) => profileId !== pId)
            .concat([{ profileId, value, ready: false }]),
        },
        lastUpdateTimestamp: getUnixTime(new Date()),
      };
    }),
    on(profileActivityReady, (state, { profileId }) => {
      const { activityMap: activities } = state;
      const valuesForCurrentActivity = activities[state.currentActivityId!];
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

      let currentActivityId = state.currentActivityId;
      let finished = state.finished;

      if (isCurrentActivityReady) {
        const currentActivityIndex = state.activityIds.indexOf(
          currentActivityId!
        );
        const nextActivityIndex = currentActivityIndex + 1;
        currentActivityId =
          nextActivityIndex === state.activityIds.length
            ? null
            : state.activityIds[nextActivityIndex];
        finished = currentActivityId === null;
      }

      return {
        ...state,
        currentActivityId,
        finished,
        lastUpdateTimestamp: getUnixTime(new Date()),
        activityMap: {
          ...activities,
          [state.currentActivityId!]: updatedValuesForCurrentActivity,
        },
      };
    }),
    on(setStartEmotion, (state, { profileId, emotion }) => {
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
  return function dispatchAction(action: Action, currentState?: State) {
    const _initialState = currentState || initialState;
    const stateAfterAction = reducer(_initialState, action);
    const hasStateChanged = !isEqual(_initialState, stateAfterAction);
    return { state: stateAfterAction, hasStateChanged };
  };
}
