// TODO: extract all common actions in similar factories as this one
function joinAndDisconnectStateTransitionsFactory(target: string) {
  return {
    join: {
      target: target,
      actions: ["join"],
    },
    disconnect: {
      target: target,
      actions: ["disconnect"],
    },
  };
}

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
        ...joinAndDisconnectStateTransitionsFactory("waiting"),
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
            ...joinAndDisconnectStateTransitionsFactory("individual"),
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
              cond: "timeoutCheck",
            },
            activityTimeout: {
              target: nextTarget,
              actions: ["timeout"],
              cond: "timeoutCheck",
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
            ...joinAndDisconnectStateTransitionsFactory("individual"),
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
              cond: "timeoutCheck",
            },
            activityTimeout: {
              target: nextTarget,
              actions: ["timeout"],
              cond: "timeoutCheck",
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
            ...joinAndDisconnectStateTransitionsFactory("group"),
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
              cond: "timeoutCheck",
            },
            activityTimeout: {
              target: nextTarget,
              actions: ["timeout"],
              cond: "timeoutCheck",
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
            ...joinAndDisconnectStateTransitionsFactory("group"),
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
              cond: "timeoutCheck",
            },
            activityTimeout: {
              target: nextTarget,
              actions: ["timeout"],
              cond: "timeoutCheck",
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
          ...joinAndDisconnectStateTransitionsFactory("individual"),
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
              cond: "timeoutCheck",
            },
            activityTimeout: {
              target: nextTarget,
              actions: ["timeout"],
              cond: "timeoutCheck",
            },
          },
        },
        group: {
          on: {
            ...joinAndDisconnectStateTransitionsFactory("group"),
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
              cond: "timeoutCheck",
            },
            activityTimeout: {
              target: nextTarget,
              actions: ["timeout"],
              cond: "timeoutCheck",
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
            ...joinAndDisconnectStateTransitionsFactory("individual"),
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
              cond: "timeoutCheck",
            },
            activityTimeout: {
              target: nextTarget,
              actions: ["timeout"],
              cond: "timeoutCheck",
            },
          },
        },
        group: {
          on: {
            ...joinAndDisconnectStateTransitionsFactory("group"),
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
              cond: "timeoutCheck",
            },
            activityTimeout: {
              target: nextTarget,
              actions: ["timeout"],
              cond: "timeoutCheck",
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
          ...joinAndDisconnectStateTransitionsFactory("individual"),
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
              cond: "timeoutCheck",
            },
            activityTimeout: {
              target: nextTarget,
              actions: ["timeout"],
              cond: "timeoutCheck",
            },
          },
        },
        group: {
          on: {
            ...joinAndDisconnectStateTransitionsFactory("group"),
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
              cond: "timeoutCheck",
            },
            activityTimeout: {
              target: nextTarget,
              actions: ["timeout"],
              cond: "timeoutCheck",
            },
          },
        },
        review: {
          on: {
            ...joinAndDisconnectStateTransitionsFactory("review"),
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
              cond: "timeoutCheck",
            },
            activityTimeout: {
              target: "group",
              actions: ["timeout"],
              cond: "timeoutCheck",
            },
          },
        },
      },
    },
  };
}
