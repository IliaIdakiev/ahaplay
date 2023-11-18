import { generateSessionRedisKey } from "../apollo/resources/session/helpers";
import { connectSequelize } from "../database";
import { getSessionWithWorkshopActivitiesAndRelations } from "../helpers/get-session-with-workshop-activities-and-relations";
import { connectRedis, pubSub } from "../redis";
import { readFromRedis, saveInRedis } from "../redis/utils";
import {
  SessionMachineSnapshot,
  createMachineServiceForActivities,
} from "./+xstate";
import {
  PubSubMessage,
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
    const activities = session.workshop.activities!;
    const service = createMachineServiceForActivities({
      machineName: session.workshop.id,
      activities,
      snapshot,
      isQuiz: session.workshop.typeInstance!.name === "Quiz",
    });
    return service;
  })
  .then((service) => {
    if (!service) {
      throw new Error("Session with provided id not found!");
    }
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
