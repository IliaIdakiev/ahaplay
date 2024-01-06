import { createMachine, fromPromise, assign, fromObservable } from "xstate";
import * as actions from "../actions/session";
import { getInvitation } from "../../apollo-graphql/queries/invite";
import { Slot } from "../../apollo-graphql/types/slot";
import { Session } from "../../apollo-graphql/types/session";
import { getSession } from "../../apollo-graphql/queries/session";
import { openSessionStateSubscription } from "../../apollo-graphql/subscriptions/session-state";

export enum SessionState {
  Initial = "initial",
  Invite = "invite",
  InvitationNotFound = "invitation-not-found",
  SessionNotFound = "session-not-found",
  SessionWaiting = "session-waiting",
  SessionOngoing = "session-ongoing",
  SessionEnded = "session-ended",
}

export interface SessionMachineContext {
  state: SessionState | null;
  slot: Slot | null;
  session: Session | null;
  millisecondsToStart: number | null;
  error: string | null;
}

export const context: SessionMachineContext = {
  state: null,
  slot: null,
  session: null,
  millisecondsToStart: null,
  error: null,
};

type AllSessionActionCreators = typeof actions;
type AllSessionActionCreatorKeys = keyof AllSessionActionCreators;
type AllSessionActions = ReturnType<
  AllSessionActionCreators[AllSessionActionCreatorKeys]
>;

type AuthMachineTypes = {
  context: SessionMachineContext;
  events: AllSessionActions;
};

export const sessionMachine = createMachine({
  types: {} as AuthMachineTypes,
  id: "session",
  initial: SessionState.Initial,
  context,
  states: {
    [SessionState.Initial]: {
      on: {
        [actions.getInvite.type]: {
          target: SessionState.Invite,
        },
        [actions.getSession.type]: {
          target: SessionState.SessionWaiting,
        },
      },
    },
    [SessionState.Invite]: {
      invoke: {
        src: fromPromise(({ input }) => {
          const data = input as ReturnType<
            AllSessionActionCreators["getInvite"]
          >["payload"];
          return getInvitation(data);
        }),
        onDone: [
          {
            target: SessionState.InvitationNotFound,
            guard: ({ event }) => {
              return event.output.invitation === null;
            },
          },
          {
            target: SessionState.Invite,
            actions: assign({
              millisecondsToStart: ({ event }) =>
                event.output.millisecondsToStart,
              slot: ({ event }) => event.output.invitation.slot,
            }),
          },
        ],
        onError: {
          target: SessionState.Initial,
          actions: assign({
            error: ({ event }) => `${event.error}`,
          }),
        },
        input: ({ event }) => event.payload,
      },
      on: {
        [actions.getSession.type]: {
          target: SessionState.SessionWaiting,
        },
      },
    },
    [SessionState.InvitationNotFound]: {},
    [SessionState.SessionWaiting]: {
      invoke: {
        src: fromPromise(({ input }) => {
          const data = input as ReturnType<
            AllSessionActionCreators["getSession"]
          >["payload"];

          return getSession(data);
        }),
        onDone: [
          {
            target: SessionState.SessionWaiting,
            guard: ({ event }) => {
              return event.output.millisecondsToStart > 0;
            },
            actions: assign({
              millisecondsToStart: ({ event }) =>
                event.output.millisecondsToStart,
              slot: ({ event }) => event.output.session.slot,
              session: ({ event }) => event.output.session,
            }),
          },
          {
            target: SessionState.SessionOngoing,
            guard: ({ event }) => {
              return (
                event.output.millisecondsToStart <= 0 && event.output.session
              );
            },
            actions: assign({
              millisecondsToStart: ({ event }) =>
                event.output.millisecondsToStart,
              slot: ({ event, context }) =>
                event.output.session.slot || context.slot,
              session: ({ event, context }) =>
                event.output.session || context.session,
            }),
          },
          {
            target: SessionState.SessionNotFound,
            guard: ({ event }) => {
              return event.output.session === null;
            },
          },
        ],
        onError: {
          target: SessionState.Initial,
          actions: assign({
            error: ({ event }) => `${event.error}`,
          }),
        },
        input: ({ event }) => event.payload,
      },
    },
    [SessionState.SessionNotFound]: {},
    [SessionState.SessionOngoing]: {
      invoke: {
        src: fromObservable(({ input: { sessionId } }) => {
          return openSessionStateSubscription({ sessionId });
        }),
        onDone: [
          {
            target: SessionState.SessionOngoing,
            actions: assign({
              state: ({ event }) => event.output,
            }),
          },
        ],
        onError: {
          target: SessionState.Initial,
          actions: assign({
            error: ({ event }) => `${event.error}`,
          }),
        },
        input: ({ context }) => ({ sessionId: context.session!.id }),
      },
    },
  },
});
