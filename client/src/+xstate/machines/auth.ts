import { createMachine, fromPromise, assign } from "xstate";
import * as actions from "../actions/auth";
import { login } from "../../apollo-graphql/mutations/login";
import { Profile } from "../../apollo-graphql/types/profile";

export enum AuthState {
  Authenticated = "authenticated",
  Unauthenticated = "unauthenticated",
  Authenticating = "authenticating",
}

export interface AuthMachineContext {
  profile: Profile | null;
  token: string | null;
  error: null | string;
}

export const context: AuthMachineContext = {
  profile: null,
  token: null,
  error: null,
};

type AllAuthActionCreators = typeof actions;
type AllAuthActionCreatorKeys = keyof AllAuthActionCreators;
type AllAuthActions = ReturnType<
  AllAuthActionCreators[AllAuthActionCreatorKeys]
>;

type AuthMachineTypes = {
  context: AuthMachineContext;
  events: AllAuthActions;
};

export const authMachine = createMachine({
  types: {} as AuthMachineTypes,
  id: "auth",
  initial: AuthState.Unauthenticated,
  context,
  states: {
    [AuthState.Unauthenticated]: {
      on: {
        [actions.login.type]: {
          target: AuthState.Authenticating,
        },
      },
    },
    [AuthState.Authenticating]: {
      invoke: {
        src: fromPromise(({ input }) => {
          const data = input as ReturnType<
            AllAuthActionCreators["login"]
          >["payload"];
          return login(data);
        }),
        onDone: [
          {
            target: AuthState.Authenticated,
            guard: ({ event }) => {
              return (
                event.output.profile !== null && event.output.token !== null
              );
            },
            actions: assign({
              profile: ({ event }) => event.output.profile,
              token: ({ event }) => event.output.token,
              error: null,
            }),
          },
          {
            target: AuthState.Unauthenticated,
          },
        ],
        onError: {
          target: AuthState.Unauthenticated,
          actions: assign({
            error: ({ event }) => `${event.error}`,
          }),
        },
        input: ({ event }) => event.payload,
      },
    },
    [AuthState.Authenticated]: {
      on: {
        [actions.logout.type]: {
          target: AuthState.Unauthenticated,
          actions: assign({
            profile: null,
            token: null,
            error: null,
          }),
        },
      },
    },
  },
});
