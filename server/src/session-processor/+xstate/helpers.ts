export function createMachineState({
  machineName,
  stateAfterWaiting,
  states,
}: {
  machineName: string;
  stateAfterWaiting: string;
  states: any;
}) {
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
    ...states,
    viewResults: {
      type: "final",
    },
  };
}

export function createIndividualReadyOnlyState({
  machineName,
  activityName,
  nextActivityName,
}: {
  machineName: string;
  activityName: string;
  nextActivityName?: string;
}) {
  const nextTarget = `#${machineName}.${nextActivityName || "endEmotion"}`;
  return {
    [activityName]: {
      initial: "individual",
      states: {
        individual: {
          on: {
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
            activityPartTimeout: {
              target: nextTarget,
              actions: ["timeout"],
            },
            activityTimeout: {
              target: nextTarget,
              actions: ["timeout"],
            },
          },
        },
      },
    },
  };
}

export function createIndividualOnlyState({
  machineName,
  activityName,
  nextActivityName,
}: {
  machineName: string;
  activityName: string;
  nextActivityName?: string;
}) {
  const nextTarget = `#${machineName}.${nextActivityName || "endEmotion"}`;
  return {
    [activityName]: {
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
            activityPartTimeout: {
              target: nextTarget,
              actions: ["timeout"],
            },
            activityTimeout: {
              target: nextTarget,
              actions: ["timeout"],
            },
          },
        },
      },
    },
  };
}

export function createGroupOnlyState({
  machineName,
  activityName,
  nextActivityName,
}: {
  machineName: string;
  activityName: string;
  nextActivityName?: string;
}) {
  const nextTarget = `#${machineName}.${nextActivityName || "endEmotion"}`;
  return {
    [activityName]: {
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
            activityPartTimeout: {
              target: nextTarget,
              actions: ["timeout"],
            },
            activityTimeout: {
              target: nextTarget,
              actions: ["timeout"],
            },
          },
        },
      },
    },
  };
}

export function createGroupOnlyOneValueState({
  machineName,
  activityName,
  nextActivityName,
}: {
  machineName: string;
  activityName: string;
  nextActivityName?: string;
}) {
  const nextTarget = `#${machineName}.${nextActivityName || "endEmotion"}`;
  return {
    [activityName]: {
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
            activityPartTimeout: {
              target: nextTarget,
              actions: ["timeout"],
            },
            activityTimeout: {
              target: nextTarget,
              actions: ["timeout"],
            },
          },
        },
      },
    },
  };
}

export function createIndividualAndGroupState({
  machineName,
  activityName,
  nextActivityName,
}: {
  machineName: string;
  activityName: string;
  nextActivityName?: string;
}) {
  const nextTarget = `#${machineName}.${nextActivityName || "endEmotion"}`;
  return {
    [activityName]: {
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
            activityPartTimeout: {
              target: "group",
              actions: ["timeout"],
            },
            activityTimeout: {
              target: nextTarget,
              actions: ["timeout"],
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
                target: nextTarget,
                cond: "isReadyToForNextStep",
                actions: ["setReady"],
              },
              {
                target: "group",
                actions: ["setReady"],
              },
            ],
            activityPartTimeout: {
              target: nextTarget,
              actions: ["timeout"],
            },
            activityTimeout: {
              target: nextTarget,
              actions: ["timeout"],
            },
          },
        },
      },
    },
  };
}

export function createIndividualAndGroupOneValueState({
  machineName,
  activityName,
  nextActivityName,
}: {
  machineName: string;
  activityName: string;
  nextActivityName?: string;
}) {
  const nextTarget = `#${machineName}.${nextActivityName || "endEmotion"}`;
  return {
    [activityName]: {
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
            activityPartTimeout: {
              target: "group",
              actions: ["timeout"],
            },
            activityTimeout: {
              target: nextTarget,
              actions: ["timeout"],
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
            activityPartTimeout: {
              target: nextTarget,
              actions: ["timeout"],
            },
            activityTimeout: {
              target: nextTarget,
              actions: ["timeout"],
            },
          },
        },
      },
    },
  };
}

export function createIndividualGroupAndReviewState({
  machineName,
  activityName,
  nextActivityName,
}: {
  machineName: string;
  activityName: string;
  nextActivityName?: string;
}) {
  const nextTarget = `#${machineName}.${nextActivityName || "endEmotion"}`;
  return {
    [activityName]: {
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
          activityPartTimeout: {
            target: "group",
            actions: ["timeout"],
          },
          activityTimeout: {
            target: nextTarget,
            actions: ["timeout"],
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
            activityPartTimeout: {
              target: "review",
              actions: ["timeout"],
            },
            activityTimeout: {
              target: nextTarget,
              actions: ["timeout"],
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
            activityPartTimeout: {
              target: nextTarget,
              actions: ["timeout"],
            },
            activityTimeout: {
              target: "group",
              actions: ["timeout"],
            },
          },
        },
      },
    },
  };
}
