import {
  getUnixTime,
  minutesToMilliseconds,
  differenceInMinutes,
  fromUnixTime,
} from "date-fns";
import { connectRedis, pubSub, redisClient } from "../redis";
import {
  ActivityMode,
  InMemorySessionStage,
  PubSubActionMessage,
  PubSubActionMessageResult,
  PubSubMessage,
  SessionProcessorMessage,
} from "./types";
import {
  activityAssociationNames,
  answerAssociationNames,
  assignmentAssociationNames,
  benchmarkAssociationNames,
  conceptAssociationNames,
  conceptualizationAssociationNames,
  connectSequelize,
  goalAssociationNames,
  instructionAssociationNames,
  models,
  questionAssociationNames,
  theoryAssociationNames,
  typeAssociationNames,
  workshopAssociationNames,
} from "../database";
import {
  generateRedisSessionClientName,
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
  return pubSub.publish(generateRedisSessionClientName({ sessionId }), payload);
}

function getSessionWithWorkshopAndActivities(sessionId: string) {
  return models.session.findByPk(sessionId, {
    include: [
      {
        model: models.workshop,
        as: workshopAssociationNames.singular,
        include: [
          {
            model: models.goal,
            as: goalAssociationNames.plural,
          },
          {
            model: models.type,
            as: typeAssociationNames.singular,
            include: [
              {
                model: models.instruction,
                as: instructionAssociationNames.plural,
              },
            ],
          },
          {
            model: models.activity,
            as: activityAssociationNames.plural,
            include: [
              {
                model: models.question,
                as: questionAssociationNames.singular,
              },
              {
                model: models.answer,
                as: answerAssociationNames.plural,
              },
              {
                model: models.benchmark,
                as: benchmarkAssociationNames.singular,
              },
              {
                model: models.conceptualization,
                as: conceptualizationAssociationNames.singular,
              },
              {
                model: models.concept,
                as: conceptAssociationNames.plural,
              },
              {
                model: models.theory,
                as: theoryAssociationNames.singular,
              },
              {
                model: models.assignment,
                as: assignmentAssociationNames.singular,
              },
            ],
          },
        ],
      },
    ],
  });
}

const scheduler = {
  isSessionTimerRunning: false,
  timerIds: {
    session: null as NodeJS.Timeout | null,
    profile: null as NodeJS.Timeout | null,
    group: null as NodeJS.Timeout | null,
  },
  timestamps: {
    session: null as number | null,
    profile: null as number | null,
    group: null as number | null,
  },
  startSessionTimer(durationInMinutes: number, sessionEndCallback: () => void) {
    this.timestamps.session = getUnixTime(new Date());
    this.isSessionTimerRunning = true;
    this.timerIds.session = setTimeout(() => {
      this.timestamps.session = null;
      this.timerIds.session = null;
      sessionEndCallback();
    }, minutesToMilliseconds(durationInMinutes));
  },
  startProfileActivityTimer(
    durationInMinutes: number,
    profileActivityEndCallback: () => void
  ) {
    this.timestamps.profile = getUnixTime(new Date());
    this.timerIds.profile = setTimeout(() => {
      this.timestamps.session = null;
      this.timerIds.session = null;
      profileActivityEndCallback();
    }, minutesToMilliseconds(durationInMinutes));
  },
  startGroupActivityTimer(
    durationInMinutes: number,
    groupActivityEndCallback: () => void
  ) {
    this.timestamps.group = getUnixTime(new Date());
    this.timerIds.group = setTimeout(() => {
      this.timestamps.session = null;
      this.timerIds.session = null;
      groupActivityEndCallback();
    }, minutesToMilliseconds(durationInMinutes));
  },
};

Promise.all([
  connectSequelize().then(() => getSessionWithWorkshopAndActivities(sessionId)),
  connectRedis(),
]).then(([session]) => {
  if (!session) {
    throw new Error("Session with provided id not found!");
  }
  publishMessage({ type: SessionProcessorMessage.SESSION_PROCESSOR_STARTED });

  // setTimeout(() => {
  //   process.exit();
  // }, 5000);

  pubSub.subscribe(
    generateRedisSessionClientName({ sessionId }),
    (message: PubSubMessage<any>) => {
      if (message.type === SessionProcessorMessage.DISPATCH_ACTION) {
        const actionMessage = message as PubSubActionMessage;
        createInMemoryDispatcher(sessionId, {
          allowNullProfile: actionMessage.data.allowNullProfile,
        })
          .then((dispatch) => dispatch(actionMessage.data.action))
          .then((result) => {
            if (
              result[0].state.currentStage === InMemorySessionStage.ON_GOING &&
              !scheduler.isSessionTimerRunning
            ) {
              scheduler.startSessionTimer(session.workshop!.duration, () => {
                // TODO: Create functionality to force end of workshop
                console.log("Session ended!");
              });
            }

            if (
              result[0].state.currentStage ===
              InMemorySessionStage.END_EMOTION_CHECK
            ) {
              const endTimestamp = getUnixTime(new Date());
              clearTimeout(scheduler.timerIds.session!);
              // Create functionality to set the workshop end time
              const timeSpend = differenceInMinutes(
                fromUnixTime(scheduler.timestamps.session!),
                fromUnixTime(endTimestamp)
              );
              console.log(
                "Session finished successfully in time (" +
                  timeSpend +
                  "). Unix end timestamp: " +
                  getUnixTime(new Date())
              );
            }

            const currentGroupActivity = session.workshop!.activities!.find(
              (a) => a.id === result[0].state.currentGroupActivityId
            );
            const currentProfileActivity = session.workshop!.activities!.find(
              (a) => a.id === result[1].state.currentProfileActivityId
            );

            // if (
            //   result[0].state.currentStage === InMemorySessionStage.ON_GOING &&
            //   result[0].state.activityMode === ActivityMode.GROUP &&
            //   result[0].differences?.find((d) =>
            //     d.path?.includes("currentGroupActivityId")
            //   ) &&

            // ) {
            // }

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
