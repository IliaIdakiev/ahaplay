import { generateSessionRedisKey } from "../apollo/resources/session/helpers";
import { connectSequelize } from "../database";
import { getSessionWithWorkshopActivitiesAndRelations } from "../helpers/get-session-with-workshop-activities-and-relations";
import { connectRedis, pubSub } from "../redis";
import { readFromRedis, saveInRedis } from "../redis/utils";
import {
  SessionMachineSnapshot,
  createMachineServiceFromWorkshop,
} from "./+xstate";
import { Scheduler } from "./scheduler";
import {
  PubSubMessage,
  PubSubXActionInnerMessageResult,
  PubSubXActionMessageResult,
  SessionProcessorMessage,
} from "./types";
import {
  generateRedisSessionClientName,
  generateRedisSessionProcessorName,
} from "./utils";

const args = process.argv.slice(2);
const sessionId = args[0];
if (!sessionId) {
  throw new Error("No session id provided");
}

const sessionRedisKey = generateSessionRedisKey({ sessionId });

function publishMessage(payload: any) {
  return pubSub.publish(generateRedisSessionClientName({ sessionId }), payload);
}

const scheduleSnapshotSave = (() => {
  let lastUpdatedSnapshot: SessionMachineSnapshot | null = null;
  let isSaveScheduled = false;
  return function saveCurrentSnapshotForFrameHandler(
    snapshot: SessionMachineSnapshot
  ) {
    if (!snapshot) return;
    lastUpdatedSnapshot = snapshot;
    if (isSaveScheduled) return;
    Promise.resolve().then(() => {
      isSaveScheduled = false;
      lastUpdatedSnapshot = null;
      saveInRedis(sessionRedisKey, lastUpdatedSnapshot).then(() => {
        console.log(
          `%cSession Snapshot saved in redis at ${new Date()}`,
          "color: green"
        );
      });
    });
  };
})();

function innerActionHandler(snapshot: SessionMachineSnapshot) {
  const { context, value } = snapshot;
  const actionResult: PubSubXActionInnerMessageResult = {
    type: SessionProcessorMessage.INNER_ACTION_RESULT,
    data: { context, stateValue: value },
  };
  scheduleSnapshotSave(snapshot);
  publishMessage(actionResult);
}

Promise.all([
  connectSequelize().then(() =>
    getSessionWithWorkshopActivitiesAndRelations(sessionId)
  ),
  connectRedis().then(() =>
    readFromRedis<SessionMachineSnapshot>(sessionRedisKey)
  ),
])
  .then(([session, snapshot]) => {
    if (!session || !session.workshop) return null;
    const service = createMachineServiceFromWorkshop({
      machineName: session.workshop.id,
      workshop: session.workshop,
      snapshot,
    });
    return { service, workshop: session.workshop! };
  })
  .then((data) => {
    if (!data) {
      throw new Error("Session with provided id not found!");
    }
    const { service, workshop } = data;
    const scheduler = new Scheduler(service as any, workshop.duration);
    scheduler.on("workshopTimeout", innerActionHandler);
    scheduler.on("activityTimeout", innerActionHandler);
    scheduler.on("activityPartTimeout", innerActionHandler);
    publishMessage({ type: SessionProcessorMessage.SESSION_PROCESSOR_STARTED });

    pubSub.subscribe(
      generateRedisSessionProcessorName({ sessionId }),
      (message: PubSubMessage<any>) => {
        if (message.type === SessionProcessorMessage.DISPATCH_ACTION) {
          const { context, value: stateValue } = service.send(
            message.data.action
          );
          scheduleSnapshotSave(
            service.getSnapshot() as unknown as SessionMachineSnapshot
          );
          const actionResult: PubSubXActionMessageResult = {
            type: SessionProcessorMessage.ACTION_RESULT,
            data: { context, stateValue, action: message.data.action },
          };
          publishMessage(actionResult);
        }
      }
    );

    process.on("exit", () => {
      console.log(
        `%cChild process for sessionId: ${sessionId} stopped!`,
        "color: red"
      );
      // clear name from db
      // save last state ?
    });
  });
