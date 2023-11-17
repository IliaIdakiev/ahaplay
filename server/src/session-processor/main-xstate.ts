import {
  models,
  workshopAssociationNames,
  goalAssociationNames,
  typeAssociationNames,
  instructionAssociationNames,
  activityAssociationNames,
  questionAssociationNames,
  answerAssociationNames,
  benchmarkAssociationNames,
  conceptualizationAssociationNames,
  conceptAssociationNames,
  theoryAssociationNames,
  assignmentAssociationNames,
  connectSequelize,
} from "../database";
import { connectRedis, pubSub } from "../redis";
import {
  SessionMachineSnapshot,
  createMachineServiceFromWorkshop,
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

function publishMessage(payload: any) {
  return pubSub.publish(generateRedisSessionClientName({ sessionId }), payload);
}

Promise.all([
  connectSequelize().then(() => getSessionWithWorkshopAndActivities(sessionId)),
  connectRedis(),
])
  .then(([session]) => {
    if (!session || !session.workshop) return null;
    const workshop = session.workshop;
    const service = createMachineServiceFromWorkshop({
      machineName: workshop.id,
      workshop,
    });
    return service;
  })
  .then((service) => {
    if (!service) {
      throw new Error("Session with provided id not found!");
    }
    publishMessage({ type: SessionProcessorMessage.SESSION_PROCESSOR_STARTED });

    pubSub.subscribe(
      generateRedisSessionProcessorName({ pid: process.pid.toString() }),
      (message: PubSubMessage<any>) => {
        if (message.type === SessionProcessorMessage.DISPATCH_ACTION) {
          const { context, value: stateValue } = service.send(
            message.data.action
          );
          const actionResult: PubSubXActionMessageResult = {
            type: SessionProcessorMessage.ACTION_RESULT,
            data: { context, stateValue, action: message.data.action },
          };
          publishMessage(actionResult);
        }
      }
    );
  });
