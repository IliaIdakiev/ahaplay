import {
  moveToNextActivity,
  profileActivityReady,
  setProfileActivityValue,
} from "../actions";
import { ActivityEntry } from "../types";
import { createReducer, on } from "../utils/reducer-creator";

export interface InMemoryProfileMetadataState {
  // INFO:
  // activities: { [activityId]: { profileId: string, questionId: string } }
  readonly activityIds: string[];
  readonly activityMap: Record<string, ActivityEntry[]>;
  readonly currentActivityId: string | null;
  readonly isCurrentActivityReady: boolean;
  readonly isFinished: boolean;
}

export function createProfileReducerInitialState({
  activityIds,
  currentActivityId,
  activityMap,
}: {
  activityIds: string[];
  currentActivityId: string;
  activityMap?: InMemoryProfileMetadataState["activityMap"];
}) {
  activityMap =
    activityMap ||
    activityIds.reduce((acc, activityId) => ({ ...acc, [activityId]: [] }), {});

  const isCurrentActivityReady = activityMap[currentActivityId].every(
    (a) => a.ready
  );
  const currentActivityIndex = activityIds.indexOf(currentActivityId);
  const nextActivityIndex = currentActivityIndex + 1;
  const isFinished =
    isCurrentActivityReady && nextActivityIndex > activityIds.length;

  const initialState: InMemoryProfileMetadataState = {
    currentActivityId,
    activityIds,
    activityMap,
    isCurrentActivityReady,
    isFinished,
  };
  return initialState;
}

export function getProfileReducer(initialState: InMemoryProfileMetadataState) {
  return createReducer(
    initialState,
    on(
      setProfileActivityValue,
      (state, { profileId, questionId, activityId }) => {
        const { activityMap: activities } = state;
        const valueForCurrentActivity = activities[activityId];
        return {
          ...state,
          activityMap: {
            ...activities,
            [activityId]: valueForCurrentActivity
              .filter(({ profileId: pId }) => profileId !== pId)
              .concat([{ profileId, questionId, ready: false }]),
          },
        };
      }
    ),
    on(profileActivityReady, (state, { profileId, activityId }) => {
      const { activityMap: activities } = state;
      const valuesForCurrentActivity = activities[activityId];
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

      return {
        ...state,
        activityMap: {
          ...activities,
          [activityId]: updatedValuesForCurrentActivity,
        },
        isCurrentActivityReady,
      };
    }),
    on(moveToNextActivity, (state) => {
      if (!state.isCurrentActivityReady) {
        return state;
      }
      const currentActivityIndex = state.activityIds.indexOf(
        state.currentActivityId!
      );
      const nextActivityIndex = currentActivityIndex + 1;
      if (nextActivityIndex > state.activityIds.length) {
        return {
          ...state,
          currentActivityId: null,
          isFinished: true,
        };
      }
      const nextActivityId = state.activityIds[nextActivityIndex];
      return {
        ...state,
        currentActivityId: nextActivityId,
      };
    })
  );
}
