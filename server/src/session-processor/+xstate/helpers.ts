import {
  ActivityModelInstance,
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
} from "../../database";

export function createMachineState(
  machineName: string,
  stateAfterWaiting: string,
  otherStates: any
) {
  return {
    waiting: {
      on: {
        join: {
          target: "waiting",
          actions: ["join"],
        },
        disconnect: {
          target: "waiting",
          actions: ["disconnect"],
        },
        readyToStart: [
          {
            target: `#${machineName}.${stateAfterWaiting}`,
            cond: "isReadyToStart",
            actions: ["readyToStart"],
          },
          {
            target: "waiting",
            actions: ["readyToStart"],
          },
        ],
      },
    },
    ...otherStates,
    viewResults: {
      type: "final",
    },
  };
}

export function createIndividualReadyOnlyState(
  machineName: string,
  activity: ActivityModelInstance | string,
  nextActivity?: ActivityModelInstance | string | undefined | null
) {
  return {
    [typeof activity === "string" ? activity : activity.id]: {
      initial: "individual",
      states: {
        individual: {
          on: {
            setReady: [
              {
                target: `#${machineName}.${
                  typeof nextActivity === "string"
                    ? nextActivity
                    : nextActivity?.id || "endEmotion"
                }`,
                actions: ["setReady"],
                cond: "isReadyToForNextStep",
              },
              {
                target: "individual",
                actions: ["setReady"],
              },
            ],
          },
        },
      },
    },
  };
}

export function createIndividualOnlyState(
  machineName: string,
  activity: ActivityModelInstance | string,
  nextActivity?: ActivityModelInstance | string | undefined | null
) {
  const nextTarget = `#${machineName}.${
    typeof nextActivity === "string"
      ? nextActivity
      : nextActivity?.id || "endEmotion"
  }`;
  return {
    [typeof activity === "string" ? activity : activity.id]: {
      initial: "individual",
      states: {
        individual: {
          on: {
            setValue: {
              target: "individual",
              actions: ["setValue"],
            },
            setReady: [
              {
                target: nextTarget,
                actions: ["setReady"],
                cond: "isReadyToForNextStep",
              },
              {
                target: "individual",
                actions: ["setReady"],
              },
            ],
            activityTimeout: {
              target: nextTarget,
              actions: ["activityTimeout"],
            },
          },
        },
      },
    },
  };
}

export function createGroupOnlyState(
  machineName: string,
  activity: ActivityModelInstance | string,
  nextActivity?: ActivityModelInstance | string | undefined | null
) {
  const nextTarget = `#${machineName}.${
    typeof nextActivity === "string"
      ? nextActivity
      : nextActivity?.id || "endEmotion"
  }`;
  return {
    [typeof activity === "string" ? activity : activity.id]: {
      initial: "group",
      states: {
        group: {
          on: {
            setValue: {
              target: "group",
              actions: ["setValue"],
            },
            setReady: [
              {
                target: nextTarget,
                cond: "isReadyToForNextStep",
                actions: ["setReady"],
              },
              {
                target: "group",
                actions: ["setReady"],
              },
            ],
            activityTimeout: {
              target: nextTarget,
              actions: ["activityTimeout"],
            },
          },
        },
      },
    },
  };
}

export function createGroupOnlyOneValueState(
  machineName: string,
  activity: ActivityModelInstance | string,
  nextActivity?: ActivityModelInstance | string | undefined | null
) {
  const nextTarget = `#${machineName}.${
    typeof nextActivity === "string"
      ? nextActivity
      : nextActivity?.id || "endEmotion"
  }`;
  return {
    [typeof activity === "string" ? activity : activity.id]: {
      initial: "group",
      states: {
        group: {
          on: {
            setValue: {
              target: "group",
              actions: ["setOneValue"],
            },
            setReady: [
              {
                target: nextTarget,
                cond: "isReadyToForNextStep",
                actions: ["setReady"],
              },
              {
                target: "group",
                actions: ["setReady"],
              },
            ],
            activityTimeout: {
              target: nextTarget,
              actions: ["activityTimeout"],
            },
          },
        },
      },
    },
  };
}

export function createIndividualAndGroupState(
  machineName: string,
  activity: ActivityModelInstance | string,
  nextActivity?: ActivityModelInstance | string | undefined | null
) {
  const nextTarget = `#${machineName}.${
    typeof nextActivity === "string"
      ? nextActivity
      : nextActivity?.id || "endEmotion"
  }`;
  return {
    [typeof activity === "string" ? activity : activity.id]: {
      initial: "individual",
      states: {
        individual: {
          on: {
            setValue: {
              target: "individual",
              actions: ["setValue"],
            },
            setReady: [
              {
                target: "group",
                actions: ["setReady"],
                cond: "isReadyToForNextStep",
              },
              {
                target: "individual",
                actions: ["setReady"],
              },
            ],
            activityTimeout: {
              target: "group",
              actions: ["activityTimeout"],
            },
          },
        },
        group: {
          on: {
            setValue: {
              target: "group",
              actions: ["setValue"],
            },
            setReady: [
              {
                target: nextActivity,
                cond: "isReadyToForNextStep",
                actions: ["setReady"],
              },
              {
                target: "group",
                actions: ["setReady"],
              },
            ],
            activityTimeout: {
              target: nextTarget,
              actions: ["activityTimeout"],
            },
          },
        },
      },
    },
  };
}

export function createIndividualAndGroupOneValueState(
  machineName: string,
  activity: ActivityModelInstance | string,
  nextActivity?: ActivityModelInstance | string | undefined | null
) {
  const nextTarget = `#${machineName}.${
    typeof nextActivity === "string"
      ? nextActivity
      : nextActivity?.id || "endEmotion"
  }`;
  return {
    [typeof activity === "string" ? activity : activity.id]: {
      initial: "individual",
      states: {
        individual: {
          on: {
            setValue: {
              target: "individual",
              actions: ["setValue"],
            },
            setReady: [
              {
                target: "group",
                actions: ["setReady"],
                cond: "isReadyToForNextStep",
              },
              {
                target: "individual",
                actions: ["setReady"],
              },
            ],
            activityTimeout: {
              target: "group",
              actions: ["activityTimeout"],
            },
          },
        },
        group: {
          on: {
            setValue: {
              target: "group",
              actions: ["setOneValue"],
            },
            setReady: [
              {
                target: nextTarget,
                cond: "isReadyToForNextStep",
                actions: ["setReady"],
              },
              {
                target: "group",
                actions: ["setReady"],
              },
            ],
            activityTimeout: {
              target: nextTarget,
              actions: ["activityTimeout"],
            },
          },
        },
      },
    },
  };
}

export function createIndividualGroupAndReviewState(
  machineName: string,
  activity: ActivityModelInstance | string,
  nextActivity?: ActivityModelInstance | string | undefined | null
) {
  const nextTarget = `#${machineName}.${
    typeof nextActivity === "string"
      ? nextActivity
      : nextActivity?.id || "endEmotion"
  }`;
  return {
    [typeof activity === "string" ? activity : activity.id]: {
      initial: "individual",
      states: {
        individual: {
          on: {
            setValue: {
              target: "individual",
              actions: ["setValue"],
            },
            setReady: [
              {
                target: "group",
                actions: ["setReady"],
                cond: "isReadyToForNextStep",
              },
              {
                target: "individual",
                actions: ["setReady"],
              },
            ],
          },
          activityTimeout: {
            target: "group",
            actions: ["activityTimeout"],
          },
        },
        group: {
          on: {
            setValue: {
              target: "group",
              actions: ["setValue"],
            },
            setReady: [
              {
                target: "review",
                cond: "isReadyToForNextStep",
                actions: ["setReady"],
              },
              {
                target: "group",
                actions: ["setReady"],
              },
            ],
            activityTimeout: {
              target: "review",
              actions: ["activityTimeout"],
            },
          },
        },
        review: {
          on: {
            setReady: [
              {
                target: nextTarget,
                cond: "isReadyToForNextStep",
                actions: ["setReady"],
              },
              {
                target: "review",
                actions: ["setReady"],
              },
            ],
            activityTimeout: {
              target: "group",
              actions: ["activityTimeout"],
            },
          },
        },
      },
    },
  };
}

export function getSessionWithWorkshopAndActivities(sessionId: string) {
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
            order: [["sequence_number", "ASC"]],
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
