import { InMemorySessionStage } from "../../../../../redis";
import { getNextStage } from "../helpers";
import {
  addParticipant,
  endEmotionReady,
  finish,
  groupActivityReady,
  readyToStart,
  removeParticipant,
  setGroupActivityValue,
  setTeamName,
  startEmotionReady,
  teamNameReady,
} from "../actions";
import { createReducer, on } from "../utils/reducer-creator";
import { ActivityEntry } from "../types";

export interface InMemorySessionMetadataState {
  // INFO:
  // stages: { [InMemorySessionStage]: profileIds[] }
  // activities: { [activityId]: { profileId: string, questionId: string, ready: boolean } }
  readonly participantProfileIds: string[];
  readonly teamName: string | null;
  readonly currentStage: InMemorySessionStage;
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
}

export function createSessionReducerInitialState({
  participantProfileIds,
  activityIds,
  currentActivityId,
  teamName,
  currentStage,
  stages,
  activityMap,
}: {
  participantProfileIds: string[];
  activityIds: string[];
  currentActivityId: string;
  teamName?: string;
  currentStage?: InMemorySessionStage;
  stages?: InMemorySessionMetadataState["stages"];
  activityMap?: InMemorySessionMetadataState["activityMap"];
}) {
  activityMap =
    activityMap ||
    activityIds.reduce((acc, activityId) => ({ ...acc, [activityId]: [] }), {});

  const isCurrentActivityReady = activityMap[currentActivityId].every(
    (a) => a.ready
  );
  const currentActivityIndex = activityIds.indexOf(currentActivityId);
  const nextActivityIndex = currentActivityIndex + 1;
  const allActivitiesFinished =
    isCurrentActivityReady && nextActivityIndex > activityIds.length;

  const initialState: InMemorySessionMetadataState = {
    participantProfileIds,
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
    return { ...state };
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
  return createReducer(
    initialState,
    on(addParticipant, (state, { ids }) => {
      return {
        ...state,
        participantProfileIds: state.participantProfileIds.concat(ids),
      };
    }),
    on(removeParticipant, (state, { ids }) => {
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
    on(
      setGroupActivityValue,
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
    on(groupActivityReady, (state, { profileId, activityId }) => {
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

      return {
        ...state,
        activityMap: {
          ...activities,
          [activityId]: updatedValuesForCurrentActivity,
        },
      };
    })
  );
}
