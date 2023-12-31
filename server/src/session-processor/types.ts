import { StateValue } from "xstate";
import { SessionMachineActions, SessionMachineContext } from "./+xstate";
export enum SessionProcessorStatus {
  STARTING = "STARTING",
  STARTED = "STARTED",
  STOPPED = "STOPPED",
  FINISHED = "FINISHED",
}

export enum SessionProcessorMessage {
  SESSION_PROCESSOR_STARTED = "SESSION_PROCESSOR_STARTED",
  SESSION_PROCESSOR_STOPPED = "SESSION_PROCESSOR_STOPPED",

  DISPATCH_ACTION = "DISPATCH_ACTION",
  ACTION_RESULT = "ACTION_RESULT",

  INNER_ACTION_RESULT = "INNER_ACTION_RESULT",

  UNHANDLED_REJECTION = "UNHANDLED_REJECTION",
  UNCAUGHT_EXCEPTION = "UNCAUGHT_EXCEPTION",
}

export interface PubSubMessage<T = void> {
  uuid: string;
  type: SessionProcessorMessage;
  data: T;
}

export interface PubSubXActionMessage
  extends PubSubMessage<{
    action: SessionMachineActions;
  }> {
  type: SessionProcessorMessage.DISPATCH_ACTION;
}

export interface PubSubXActionMessageResult
  extends PubSubMessage<{
    context: SessionMachineContext;
    stateValue: StateValue;
  }> {
  type: SessionProcessorMessage.ACTION_RESULT;
}
