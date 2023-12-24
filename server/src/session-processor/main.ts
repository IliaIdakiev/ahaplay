import {
  generateSessionRedisKey,
  generateSessionUpdateSubscriptionEvent,
  graphqlInMemorySessionStateSerializer,
} from "../apollo/resources/session/helpers";
import { connectSequelize } from "../database";
import { getSessionWithWorkshopActivitiesAndRelations } from "../helpers/get-session-with-workshop-activities-and-relations";
import { connectRedis, pubSub } from "../redis";
import { readFromRedis, saveInRedis } from "../redis/utils";
import {
  SessionMachineSnapshot,
  sessionMachineServiceFromWorkshopFactory,
} from "./+xstate";
import { Scheduler } from "./scheduler";
import {
  PubSubMessage,
  PubSubXActionMessageResult,
  SessionProcessorMessage,
} from "./types";
import {
  generateRedisSessionClientName,
  generateRedisSessionProcessorName,
} from "./utils";
import * as fs from "fs";

const args = process.argv.slice(2);
const sessionId = args[1];
if (!sessionId) {
  throw new Error("No session id provided");
}

const sessionRedisKey = generateSessionRedisKey({ sessionId });
const currentProcessName = generateRedisSessionProcessorName({ sessionId });

export function publishSessionState(config: {
  sessionId: string;
  snapshot: SessionMachineSnapshot;
}): void {
  const {
    sessionId,
    snapshot: { context, value },
  } = config;
  const stateValue = typeof value === "string" ? value : JSON.stringify(value);

  const sessionStateGraphQL = graphqlInMemorySessionStateSerializer({
    context,
    stateValue,
  });

  const eventName = generateSessionUpdateSubscriptionEvent({
    sessionId,
  });

  pubSub.publish(eventName, {
    sessionState: sessionStateGraphQL,
  });
}

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
        // console.log(
        //   `%cSession Snapshot saved in redis at ${new Date()}`,
        //   "color: green"
        // );
      });
    });
  };
})();

function innerActionHandler(snapshot: SessionMachineSnapshot) {
  scheduleSnapshotSave(snapshot);
  publishSessionState({ sessionId, snapshot });
}

function sessionFinished() {
  // TODO: save to database
  console.log("Session finished. Starting process kill timeout...");
  setTimeout(() => {
    process.exit(0);
  }, 10000);
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
    const service = sessionMachineServiceFromWorkshopFactory({
      machineName: session.workshop.id,
      workshop: session.workshop,
      snapshot,
    });
    service.onDone(sessionFinished);
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

    publishMessage({
      type: SessionProcessorMessage.SESSION_PROCESSOR_STARTED,
      data: { sessionId },
    });

    pubSub.subscribe(currentProcessName, (message: PubSubMessage<any>) => {
      if (message.type === SessionProcessorMessage.DISPATCH_ACTION) {
        try {
          const snapshot = service.send(
            message.data.action
          ) as unknown as SessionMachineSnapshot;
          const { context, value: stateValue } = snapshot;
          scheduleSnapshotSave(
            service.getSnapshot() as unknown as SessionMachineSnapshot
          );
          const actionResult: PubSubXActionMessageResult = {
            type: SessionProcessorMessage.ACTION_RESULT,
            data: { context, stateValue },
            uuid: message.uuid,
          };
          publishMessage(actionResult);
          publishSessionState({ sessionId, snapshot });
        } catch (error: any) {
          const actionResult: PubSubMessage<Error> = {
            type: SessionProcessorMessage.UNCAUGHT_EXCEPTION,
            data: error,
            uuid: message.uuid,
          };
          publishMessage(actionResult);
        }
      }
    });

    process.on("exit", () => {
      console.log(
        `%cChild process for sessionId: ${sessionId} stopped!`,
        "color: red"
      );
      // clear name from db
      // save last state ?
    });
  });
