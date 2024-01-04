import { createAction, props } from "../utils";

export const getInvite = createAction(
  "[SESSION] Get Invite",
  props<{ email: string; slotId: string }>()
);

export const getSession = createAction(
  "[SESSION] Get Session",
  props<{ sessionKey: string; includeSlotAndWorkshop: boolean }>()
);
