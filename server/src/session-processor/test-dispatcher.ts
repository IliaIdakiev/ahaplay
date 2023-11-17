import { startSessionProcessor } from ".";
import { pubSub, connectRedis, redisClient } from "../redis";
import {
  SessionMachineActions,
  SessionMachineContext,
  createJoinAction,
  createReadyToStartAction,
} from "./+xstate";
import {
  PubSubXActionMessage,
  SessionProcessorMessage,
  PubSubMessage,
  PubSubXActionMessageResult,
} from "./types";
import {
  generateRedisSessionClientName,
  generateRedisSessionProcessorSessionIdKey,
  generateRedisSessionProcessorName,
} from "./utils";

const args = process.argv.slice(2);
const sessionId = args[0];
if (!sessionId) {
  throw new Error("No session id provided");
}

connectRedis()
  .then(() => startSessionProcessor(sessionId))
  .then(() => {
    return Promise.all([
      dispatchActionToProcessor(
        sessionId,
        createJoinAction({ profileId: "1" })
      ),
      dispatchActionToProcessor(
        sessionId,
        createJoinAction({ profileId: "2" })
      ),
      dispatchActionToProcessor(
        sessionId,
        createJoinAction({ profileId: "3" })
      ),
    ]);
  })
  .then(() => {
    return Promise.all([
      dispatchActionToProcessor(
        sessionId,
        createReadyToStartAction({ profileId: "1" })
      ),
      dispatchActionToProcessor(
        sessionId,
        createReadyToStartAction({ profileId: "2" })
      ),
      dispatchActionToProcessor(
        sessionId,
        createReadyToStartAction({ profileId: "3" })
      ),
    ]);
  });

export function messageSessionProcessor(pid: string, message: any) {
  return pubSub.publish(generateRedisSessionProcessorName({ pid }), message);
}

export function dispatchActionToProcessor(
  sessionId: string,
  action: SessionMachineActions
) {
  const redisSessionProcessorSessionIdKey =
    generateRedisSessionProcessorSessionIdKey(sessionId);

  return redisClient.get(redisSessionProcessorSessionIdKey).then((pid) => {
    if (!pid) {
      throw new Error("Pid not found!");
    }
    const message: PubSubXActionMessage = {
      type: SessionProcessorMessage.DISPATCH_ACTION,
      data: { action },
    };
    return messageSessionProcessor(pid, message).then(() =>
      listenForSessionProcessorActionResult(sessionId, action)
    );
  });
}

export function listenForSessionProcessorActionResult(
  sessionId: string,
  action: SessionMachineActions
) {
  return new Promise<SessionMachineContext>((res, rej) => {
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

      if (
        message.type !== SessionProcessorMessage.ACTION_RESULT ||
        (message as unknown as PubSubXActionMessageResult).data.action ===
          action
      )
        return;

      const actionResultMessage =
        message as unknown as PubSubXActionMessageResult;
      res(actionResultMessage.data.context);
      pubSub.unsubscribe(subscriptionId!);
    };

    pubSub
      .subscribe(generateRedisSessionClientName({ sessionId }), handler)
      .then((id) => (subscriptionId = id));
  });
}
