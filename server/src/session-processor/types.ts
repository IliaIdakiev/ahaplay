import { StateValue } from "xstate";
import { Unpack } from "../types";
import { InMemoryMetadataActions, createInMemoryDispatcher } from "./+state";
import { SessionMachineActions, SessionMachineContext } from "./+xstate";

export * from "./+state/types";

export enum SessionProcessorMessage {
  SESSION_PROCESSOR_STARTED = "SESSION_PROCESSOR_STARTED",
  SESSION_PROCESSOR_STOPPED = "SESSION_PROCESSOR_STOPPED",

  DISPATCH_ACTION = "DISPATCH_ACTION",
  ACTION_RESULT = "ACTION_RESULT",

  UNHANDLED_REJECTION = "UNHANDLED_REJECTION",
  UNCAUGHT_EXCEPTION = "UNCAUGHT_EXCEPTION",
}

export interface PubSubMessage<T = void> {
  type: SessionProcessorMessage;
  data: T;
}

export interface PubSubActionMessage
  extends PubSubMessage<{
    action: InMemoryMetadataActions;
    allowNullProfile: boolean;
  }> {
  type: SessionProcessorMessage.DISPATCH_ACTION;
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
    action: SessionMachineActions;
  }> {
  type: SessionProcessorMessage.ACTION_RESULT;
}

export interface PubSubActionMessageResult
  extends PubSubMessage<{
    result: Unpack<
      ReturnType<Unpack<ReturnType<typeof createInMemoryDispatcher>>>
    >;
    action: InMemoryMetadataActions;
  }> {
  type: SessionProcessorMessage.ACTION_RESULT;
}
