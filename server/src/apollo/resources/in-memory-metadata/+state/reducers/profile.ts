import { profileActivityReady, setProfileActivityValue } from "../actions";
import { ActivityEntry } from "../types";
import { createReducer, on } from "../utils/reducer-creator";

export interface InMemoryProfileMetadataState {
  // INFO:
  // activities: { [activityId]: { profileId: string, questionId: string } }
  readonly activityIds: string[];
  readonly activityMap: Record<string, ActivityEntry[]>;
  readonly currentActivityId: string | null;
  readonly isFinished: boolean;
}

export function createProfileReducerInitialState({
  profileIds,
  activityIds,
  activityMap,
}: {
  profileIds: string[];
  activityIds: string[];
  activityMap?: InMemoryProfileMetadataState["activityMap"];
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
        activityMap: {
          ...activities,
          [state.currentActivityId!]: updatedValuesForCurrentActivity,
        },
      };
    })
  );
  type Action = Parameters<typeof reducer>[1];
  type State = Parameters<typeof reducer>[0];
  return function dispatchAction(action: Action, currentState?: State) {
    return reducer(currentState || initialState, action);
  };
}
