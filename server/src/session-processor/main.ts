import { connectRedis, pubSub, redisClient } from "../redis";
import {
  PubSubActionMessage,
  PubSubActionMessageResult,
  PubSubMessage,
  SessionProcessorMessage,
} from "./types";
import {
  activityAssociationNames,
  connectSequelize,
  models,
  workshopAssociationNames,
} from "../database";
import {
  generateRedisSessionProcessListenerName,
  generateRedisSessionProcessorPidKey,
  generateRedisSessionProcessorSessionIdKey,
} from "./utils";
import { createInMemoryDispatcher } from "./+state";

const args = process.argv.slice(2);
const sessionId = args[0];
if (!sessionId) {
  throw new Error("No session id provided");
}

function publishMessage(payload: any) {
  return pubSub.publish(
    generateRedisSessionProcessListenerName(sessionId),
    payload
  );
}

function getSessionWithWorkshopAndActivities(sessionId: string) {
  return models.session.findByPk(sessionId, {
    include: [
      {
        model: models.workshop,
        as: workshopAssociationNames.singular,
        include: [
          {
            model: models.activity,
            as: activityAssociationNames.plural,
          },
        ],
      },
    ],
  });
}

Promise.all([
  connectSequelize().then(() => getSessionWithWorkshopAndActivities(sessionId)),
  connectRedis(),
]).then(([session]) => {
  console.log(session);
  publishMessage({ type: SessionProcessorMessage.SESSION_PROCESSOR_STARTED });

  // setTimeout(() => {
  //   process.exit();
  // }, 5000);

  pubSub.subscribe(
    generateRedisSessionProcessListenerName(sessionId),
    (message: PubSubMessage<any>) => {
      if (message.type === SessionProcessorMessage.DISPATCH_ACTION) {
        const actionMessage = message as PubSubActionMessage;
        createInMemoryDispatcher(sessionId, {
          allowNullProfile: actionMessage.data.allowNullProfile,
        })
          .then((dispatch) => dispatch(actionMessage.data.action))
          .then((result) => {
            const actionResult: PubSubActionMessageResult = {
              type: SessionProcessorMessage.ACTION_RESULT,
              data: { result, action: actionMessage.data.action },
            };
            publishMessage(actionResult);
          });
      }
    }
  );
});

process.on("exit", () => {
  publishMessage({ type: SessionProcessorMessage.SESSION_PROCESSOR_STOPPED });
  const sessionIdSessionProcessorPidKey =
    generateRedisSessionProcessorSessionIdKey(sessionId);
  const sessionProcessorPidSessionIdKey = generateRedisSessionProcessorPidKey(
    process.pid.toString()
  );

  redisClient.del([
    sessionIdSessionProcessorPidKey,
    sessionProcessorPidSessionIdKey,
  ]);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  publishMessage({
    type: SessionProcessorMessage.UNHANDLED_REJECTION,
    data: reason,
  });
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  publishMessage({
    type: SessionProcessorMessage.UNCAUGHT_EXCEPTION,
    data: error,
  });
});
