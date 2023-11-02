import { getUnixTime } from "date-fns";
import {
  profileActivityReady,
  setEndEmotion,
  setProfileActivityValue,
  setStartEmotion,
} from "../actions";
import { ActivityEntry } from "../types";
import { createReducer, on } from "../utils/reducer-creator";

export interface InMemoryProfileMetadataState {
  // INFO:
  // activities: { [activityId]: { profileId: string, questionId: string } }
  readonly activityIds: string[];
  readonly activityMap: Record<string, ActivityEntry[]>;
  readonly currentActivityId: string | null;
  readonly isFinished: boolean;
  readonly startEmotions: { emotion: number; profileId: string }[];
  readonly endEmotions: { emotion: number; profileId: string }[];
  readonly lastUpdateTimestamp: number | null;
}

export function createProfileReducerInitialState({
  profileIds,
  activityIds,
  activityMap,
  startEmotions,
  endEmotions,
  lastUpdateTimestamp,
}: {
  profileIds: string[];
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
        [activityId]: profileIds.map((profileId) => ({
          profileId,
          questionId: null,
          ready: false,
        })),
      }),
      {}
    );

  const currentActivityIndex = activityIds.indexOf(currentActivityId);
  const nextActivityIndex = currentActivityIndex + 1;
  const isFinished =
    nextActivityIndex >= activityIds.length - 1 &&
    activityMap[nextActivityIndex].every((a) => a.ready);

  const initialState: InMemoryProfileMetadataState = {
    currentActivityId,
    activityIds,
    activityMap,
    isFinished,
    startEmotions: startEmotions || [],
    endEmotions: endEmotions || [],
    lastUpdateTimestamp: lastUpdateTimestamp || getUnixTime(new Date()),
  };
  return initialState;
}

export function getProfileReducer(initialState: InMemoryProfileMetadataState) {
  const reducer = createReducer(
    initialState,
    on(setProfileActivityValue, (state, { profileId, questionId }) => {
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
        lastUpdateTimestamp: getUnixTime(new Date()),
      };
    }),
    on(profileActivityReady, (state, { profileId }) => {
      const { activityMap: activities } = state;
      const valuesForCurrentActivity = activities[state.currentActivityId!];
      if (
        !valuesForCurrentActivity.find((a) => a.profileId === profileId)
          ?.questionId
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
      let isFinished = state.isFinished;

      if (isCurrentActivityReady) {
        const currentActivityIndex = state.activityIds.indexOf(
          currentActivityId!
        );
        const nextActivityIndex = currentActivityIndex + 1;
        currentActivityId =
          nextActivityIndex === state.activityIds.length
            ? null
            : state.activityIds[nextActivityIndex];
        isFinished = currentActivityId === null;
      }

      return {
        ...state,
        currentActivityId,
        isFinished,
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
    return reducer(currentState || initialState, action);
  };
}
