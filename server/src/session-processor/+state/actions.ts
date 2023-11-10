import { ActivityEntry, ActivityMode } from "./types";
import { createAction, props } from "./utils/action-creator";

export const readyToStart = createAction(
  "READY_TO_START",
  props<{ profileId: string }>()
);

export const addParticipant = createAction(
  "ADD_PARTICIPANT",
  props<{ profileIds: string[] | string }>()
);

export const removeParticipant = createAction(
  "REMOVE_PARTICIPANT",
  props<{ profileIds: string[] | string }>()
);

export const addConnectedProfile = createAction(
  "ADD_CONNECTED_PROFILE",
  props<{ profileIds: string[] | string }>()
);

export const removeConnectedProfile = createAction(
  "REMOVE_CONNECTED_PROFILE",
  props<{ profileIds: string[] | string }>()
);

export const setTeamName = createAction(
  "SET_TEAM_NAME",
  props<{ teamName: string }>()
);

export const teamNameReady = createAction(
  "TEAM_NAME_READY",
  props<{ profileId: string }>()
);

export const setStartEmotion = createAction(
  "SET_START_EMOTION",
  props<{ profileId: string; emotion: number }>()
);

export const startEmotionReady = createAction(
  "START_EMOTION_READY",
  props<{ profileId: string }>()
);

export const setEndEmotion = createAction(
  "SET_END_EMOTION",
  props<{ emotion: number; profileId: string }>()
);

export const endEmotionReady = createAction(
  "END_EMOTION_READY",
  props<{ profileId: string }>()
);

export const setProfileActivityValue = createAction(
  "SET_PROFILE_ACTIVITY_VALUE",
  props<{ value: string; profileId: string; activityId: string }>()
);

export const setGroupActivityValue = createAction(
  "SET_GROUP_ACTIVITY_VALUE",
  props<{ value: string; profileId: string; activityId: string }>()
);

export const addGroupActivityEntry = createAction(
  "ADD_GROUP_ACTIVITY_ENTRY",
  props<{ entry: ActivityEntry; activityId: string; forceUpdate?: boolean }>()
);

export const profileActivityReady = createAction(
  "PROFILE_ACTIVITY_READY",
  props<{ profileId: string; activityId: string }>()
);

export const groupActivityReady = createAction(
  "GROUP_ACTIVITY_READY",
  props<{ profileId: string; activityId: string }>()
);

export const setActivityMode = createAction(
  "SET_ACTIVITY_MODE",
  props<{ activityMode: ActivityMode }>()
);

export const finish = createAction("FINISH");