import { createAction, props } from "../utils";

export const login = createAction(
  "[AUTH] Login",
  props<{ email: string; password: string }>()
);

export const logout = createAction("[AUTH] Logout");
