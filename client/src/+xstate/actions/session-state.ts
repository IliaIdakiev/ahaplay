import { createAction, props } from "../utils";

export const openSessionStateSubscription = createAction(
  "[SESSION STATE] Open session state subscription",
  props<{ sessionId: string }>()
);

export const closeSessionStateSubscription = createAction(
  "[SESSION STATE] Close session state subscription",
  props<{ sessionId: string }>()
);
