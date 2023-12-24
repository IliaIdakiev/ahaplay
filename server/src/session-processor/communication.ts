import { RedisPubSub } from "graphql-redis-subscriptions";
import {
  generateRedisSessionClientName,
  generateRedisSessionProcessorName,
} from "./utils";
import { SessionMachineActions } from "./+xstate/types";
import {
  PubSubMessage,
  PubSubXActionMessage,
  PubSubXActionMessageResult,
  SessionProcessorMessage,
} from "./types";
import { v1 } from "uuid";
import * as fs from "fs";

export function messageSessionProcessor({
  sessionId,
  message,
  pubSub,
}: {
  sessionId: string;
  message: any;
  pubSub: RedisPubSub;
}) {
  return pubSub.publish(
    generateRedisSessionProcessorName({ sessionId }),
    message
  );
}

export function dispatchActionToProcessor({
  sessionId,
  action,
  pubSub,
}: {
  sessionId: string;
  action: SessionMachineActions;
  pubSub: RedisPubSub;
}) {
  const uuid = v1();
  const message: PubSubXActionMessage = {
    uuid,
    type: SessionProcessorMessage.DISPATCH_ACTION,
    data: { action },
  };

  const messageCheckFn = (message: PubSubXActionMessageResult) =>
    message.uuid === uuid;

  return Promise.all([
    listenForSessionProcessorActionResult<PubSubXActionMessageResult>({
      sessionId,
      messageCheckFn,
      pubSub,
    }),
    messageSessionProcessor({
      sessionId,
      message,
      pubSub,
    }),
  ]).then(([result]) => result);
}

export function listenForSessionProcessorActionResult<T>({
  sessionId,
  pubSub,
  messageCheckFn,
}: {
  sessionId: string;
  pubSub: RedisPubSub;
  messageCheckFn: (action: any) => boolean;
}): Promise<T> {
  return new Promise<any>((res, rej) => {
    let subscriptionId: number | null = null;

    const handler = (message: PubSubMessage) => {
      if (
        [
          SessionProcessorMessage.UNCAUGHT_EXCEPTION,
          SessionProcessorMessage.UNHANDLED_REJECTION,
        ].includes(message.type)
      ) {
        return rej(message.data);
      }

      if (!messageCheckFn(message)) return;

      pubSub.unsubscribe(subscriptionId!);
      res(message);
    };

    pubSub
      .subscribe(generateRedisSessionClientName({ sessionId }), handler)
      .then((id) => (subscriptionId = id));
  });
}
