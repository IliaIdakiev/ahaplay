import { StateMachine, interpret } from "xstate";
import {
  createActivityPartTimeoutAction,
  createActivityTimeoutAction,
  createDisconnectAction,
  createJoinAction,
  createReadyToStartAction,
  createSetReadyAction,
  createSetValueAction,
} from "./action-creators";

export interface SessionMachineContext {
  requiredActiveProfileCount: number;
  currentActiveProfiles: string[];
  readyActiveProfiles: string[];
  activityResult: Record<
    string,
    Record<
      "individual" | "group" | "review",
      {
        profileId: string;
        value: string;
        ready: boolean;
      }[]
    >
  >;
  lastUpdatedTimestamp: number | null;

  timeouts?: Timeouts;
}

export interface Timeouts {
  workshopMinuteTimeout?: number;
  activity?: Record<
    string,
    {
      activityMinuteTimeout?: number;
      individualMinuteTimeout?: number;
      groupMinuteTimeout?: number;
      reviewMinuteTimeout?: number;
    }
  >;
}

export type ActivityTimeoutAction = ReturnType<
  typeof createActivityTimeoutAction
>;
export type ActivityPartTimeoutAction = ReturnType<
  typeof createActivityPartTimeoutAction
>;
export type JoinAction = ReturnType<typeof createJoinAction>;
export type DisconnectAction = ReturnType<typeof createDisconnectAction>;
export type ReadyToStartAction = ReturnType<typeof createReadyToStartAction>;
export type SetValueAction = ReturnType<typeof createSetValueAction>;
export type SetReadyAction = ReturnType<typeof createSetReadyAction>;

export type SessionMachineActions =
  | JoinAction
  | DisconnectAction
  | ReadyToStartAction
  | SetValueAction
  | SetReadyAction
  | ActivityTimeoutAction
  | ActivityPartTimeoutAction;

export type SessionMachineSchema = {
  events: SessionMachineActions;
  context: SessionMachineContext;
};

export type SessionMachine = StateMachine<
  SessionMachineContext,
  SessionMachineSchema,
  SessionMachineActions
>;

export type SessionMachineSnapshot = ReturnType<
  ReturnType<
    typeof interpret<
      SessionMachineContext,
      SessionMachineSchema,
      SessionMachineActions
    >
  >["getSnapshot"]
>;
