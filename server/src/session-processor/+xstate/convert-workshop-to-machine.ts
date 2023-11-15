import { createMachine, assign, interpret } from "xstate";
import {
  ActivityModelInstance,
  WorkshopModelInstance,
  activityAssociationNames,
  answerAssociationNames,
  assignmentAssociationNames,
  benchmarkAssociationNames,
  conceptAssociationNames,
  conceptualizationAssociationNames,
  goalAssociationNames,
  instructionAssociationNames,
  models,
  questionAssociationNames,
  theoryAssociationNames,
  typeAssociationNames,
  workshopAssociationNames,
} from "../../database";

interface SessionMachineContext {
  requiredActiveProfileCount: number;
  currentActiveProfiles: string[];
  readyActiveProfiles: string[];
  activityResult: Record<
    string,
    Record<
      "individual" | "group",
      {
        profileId: string;
        value: string;
        ready: boolean;
      }[]
    >
  >;
}

function createJoinAction(data: { profileId: string }) {
  return { type: "join" as const, ...data };
}
function createDisconnectAction(data: { profileId: string }) {
  return { type: "disconnect" as const, ...data };
}
function createReadyToStartAction(data: { profileId: string }) {
  return { type: "readyToStart" as const, ...data };
}
function createSetValueAction(data: {
  profileId: string;
  activityId: string;
  value: string;
}) {
  return { type: "setValue" as const, ...data };
}
function createSetReadyAction(data: { profileId: string; activityId: string }) {
  return { type: "setReady" as const, ...data };
}

type JoinAction = ReturnType<typeof createJoinAction>;
type DisconnectAction = ReturnType<typeof createDisconnectAction>;
type ReadyToStartAction = ReturnType<typeof createReadyToStartAction>;
type SetValueAction = ReturnType<typeof createSetValueAction>;
type SetReadyAction = ReturnType<typeof createSetReadyAction>;

type SessionMachineActions =
  | JoinAction
  | DisconnectAction
  | ReadyToStartAction
  | SetValueAction
  | SetReadyAction;

function createSessionMachine(states: any, machineName: string) {
  return createMachine(
    {
      id: machineName,
      context: {
        requiredActiveProfileCount: 3,
        currentActiveProfiles: [],
        readyActiveProfiles: [],
        activityResult: {},
      },
      initial: "waiting",
      states,
      schema: {
        events: {} as SessionMachineActions,
        context: {} as SessionMachineContext,
      },
    },
    {
      actions: {
        join: assign({
          currentActiveProfiles: (context, { profileId }: JoinAction) =>
            context.currentActiveProfiles.concat(profileId),
        }),
        disconnect: assign({
          currentActiveProfiles: (context, { profileId }: DisconnectAction) =>
            context.currentActiveProfiles.filter((id) => id !== profileId),
        }),
        readyToStart: assign({
          readyActiveProfiles: (context, { profileId }: ReadyToStartAction) =>
            context.readyActiveProfiles.concat(profileId),
        }),
        setValue: assign({
          activityResult: (
            context,
            { value, profileId, activityId }: SetValueAction,
            { state }
          ) => {
            const activity = Object.keys(state?.value || {})[0];
            const mode = (state?.value as any)[activity] as
              | "individual"
              | "group"
              | undefined;

            if (!activity || mode === undefined || activityId !== activity) {
              return context.activityResult;
            }

            let currentActivityResults =
              context.activityResult?.[activity]?.[mode] || [];
            const currentActivityResult = currentActivityResults.find(
              (a) => a.profileId === profileId
            ) || { value, profileId, ready: false };
            currentActivityResult.value = value;
            currentActivityResults = currentActivityResults
              .filter((v) => v !== currentActivityResult)
              .concat({ ...currentActivityResult });
            return {
              ...context.activityResult,
              [activity]: {
                ...context.activityResult[activity],
                [mode]: currentActivityResults,
              },
            };
          },
        }),
        setReady: assign({
          activityResult: (context, data: SetReadyAction, { state }) => {
            const { profileId, activityId } = data;
            const activity = Object.keys(state?.value || {})[0];
            const mode = (state?.value as any)[activity] as
              | "individual"
              | "group"
              | undefined;

            if (!activity || mode === undefined || activityId !== activity) {
              return context.activityResult;
            }

            let currentActivityResults =
              context.activityResult?.[activity]?.[mode] || [];
            const currentActivityResult = currentActivityResults.find(
              (a) => a.profileId === profileId
            )!;
            currentActivityResults = currentActivityResults
              .filter((v) => v !== currentActivityResult)
              .concat({ ...currentActivityResult, ready: true });

            return {
              ...context.activityResult,
              [activity]: {
                ...context.activityResult[activity],
                [mode]: currentActivityResults,
              },
            };
          },
        }),
      },
      guards: {
        isReadyToStart: (context, { profileId }) =>
          context.readyActiveProfiles.concat(profileId).length ===
          context.requiredActiveProfileCount,
        isReadyToForNextStep: (context, { profileId }, { state }) => {
          const activity = Object.keys(state.value)[0];
          const mode = (state.value as any)[activity] as "individual" | "group";
          if (mode === "individual") {
            const isReady =
              context.activityResult[activity][mode].length ===
                context.requiredActiveProfileCount &&
              context.activityResult[activity][mode]
                .filter((val) => val.profileId !== profileId)
                .every((a) => a.ready);
            return isReady;
          }
          const isReady =
            context.activityResult[activity][mode]?.length ===
              context.requiredActiveProfileCount &&
            context.activityResult[activity][mode]
              .filter((val) => val.profileId !== profileId)
              .every((a) => a.ready);
          return isReady;
        },
      },
    }
  );
}

function createMachineState(
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

function createIndividualOnlyState(
  machineName: string,
  activity: ActivityModelInstance,
  nextActivity: ActivityModelInstance | undefined | null
) {
  return {
    [activity.id]: {
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
                target: `#${machineName}.${nextActivity?.id || "viewResults"}`,
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

function createGroupOnlyState(
  machineName: string,
  activity: ActivityModelInstance,
  nextActivity: ActivityModelInstance | undefined | null
) {
  return {
    [activity.id]: {
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
                target: `#${machineName}.${nextActivity?.id || "viewResults"}`,
                cond: "isReadyToForNextStep",
                actions: ["setReady"],
              },
              {
                target: "group",
                actions: ["setReady"],
              },
            ],
          },
        },
      },
    },
  };
}

function createIndividualAndGroupState(
  machineName: string,
  activity: ActivityModelInstance,
  nextActivity: ActivityModelInstance | undefined | null
) {
  return {
    [activity.id]: {
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
        },
        group: {
          on: {
            setValue: {
              target: "group",
              actions: ["setValue"],
            },
            setReady: [
              {
                target: `#${machineName}.${nextActivity?.id || "viewResults"}`,
                cond: "isReadyToForNextStep",
                actions: ["setReady"],
              },
              {
                target: "group",
                actions: ["setReady"],
              },
            ],
          },
        },
      },
    },
  };
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
            order: [["sequence_number", "ASC"]],
          },
          {
            model: models.type,
            as: typeAssociationNames.singular,
            include: [
              {
                model: models.instruction,
                as: instructionAssociationNames.plural,
                order: [["sequence_number", "ASC"]],
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
                as: conceptAssociationNames.singular,
                order: [["sequence_number", "ASC"]],
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

function convertWorkshopToMachine(
  machineName: string,
  workshop: WorkshopModelInstance
) {
  const activities = workshop.activities!;
  let states = {};
  for (const activity of activities) {
    const currentActivityIndex = activities.indexOf(activity);
    const nextActivity = activities[currentActivityIndex + 1];
    if (activity.theory) {
      // create individual part only
      states = {
        ...states,
        ...createIndividualOnlyState(workshop.id, activity, nextActivity),
      };
      continue;
    }
    if (activity.question) {
      // create individual and group part + third part that explains the answers
      states = {
        ...states,
        ...createIndividualAndGroupState(workshop.id, activity, nextActivity),
      };
      continue;
    }
    if (activity.assignment) {
      // create individual part only
      states = {
        ...states,
        ...createIndividualOnlyState(workshop.id, activity, nextActivity),
      };
      continue;
    }
    if (activity.conceptualization) {
      // create individual and group part
      states = {
        ...states,
        ...createIndividualAndGroupState(workshop.id, activity, nextActivity),
      };
      continue;
    }
    if (activity.benchmark) {
      // create individual and group part
      states = {
        ...states,
        ...createIndividualAndGroupState(workshop.id, activity, nextActivity),
      };
      continue;
    }
  }

  const machineState = createMachineState(
    machineName,
    activities[0].id,
    states
  );
  return createSessionMachine(machineState, machineName);
}

getSessionWithWorkshopAndActivities("e4beb40b-7140-48d5-9d9b-5cfe0f861cad")
  .then(
    (session) =>
      [
        convertWorkshopToMachine(session!.workshop!.id, session!.workshop!),
        session!,
      ] as const
  )
  .then(([machine, session]) => {
    const activities = session.workshop!.activities!;
    let service = interpret(machine)
      .onTransition((state) => console.log(state.value, state.context))
      .start();

    service.send(createJoinAction({ profileId: "1" }));
    service.send(createJoinAction({ profileId: "2" }));
    service.send(createJoinAction({ profileId: "3" }));

    service.send(createReadyToStartAction({ profileId: "1" }));
    service.send(createReadyToStartAction({ profileId: "2" }));
    service.send(createReadyToStartAction({ profileId: "3" }));

    // first activity stuff
    service.send(
      createSetValueAction({
        profileId: "3",
        activityId: activities[0].id,
        value: "Hello from user 3 for first activity",
      })
    );
    service.send(
      createSetValueAction({
        profileId: "2",
        activityId: activities[0].id,
        value: "Hello from user 2 for first activity",
      })
    );
    service.send(
      createSetValueAction({
        profileId: "1",
        activityId: activities[0].id,
        value: "Hello from user 1 for first activity",
      })
    );

    service.send(
      createSetReadyAction({
        profileId: "3",
        activityId: activities[0].id,
      })
    );
    service.send(
      createSetReadyAction({
        profileId: "2",
        activityId: activities[0].id,
      })
    );
    service.send(
      createSetReadyAction({
        profileId: "1",
        activityId: activities[0].id,
      })
    );

    service.send(
      createSetValueAction({
        profileId: "3",
        activityId: activities[0].id,
        value: "Hello from user 3 for first activity",
      })
    );
    service.send(
      createSetValueAction({
        profileId: "2",
        activityId: activities[0].id,
        value: "Hello from user 2 for first activity",
      })
    );
    service.send(
      createSetValueAction({
        profileId: "1",
        activityId: activities[0].id,
        value: "Hello from user 1 for first activity",
      })
    );

    service.send(
      createSetReadyAction({
        profileId: "3",
        activityId: activities[0].id,
      })
    );
    service.send(
      createSetReadyAction({
        profileId: "2",
        activityId: activities[0].id,
      })
    );
    service.send(
      createSetReadyAction({
        profileId: "1",
        activityId: activities[0].id,
      })
    );

    // second activity stuff
    service.send(
      createSetValueAction({
        profileId: "3",
        activityId: activities[1].id,
        value: "Hello from user 3 for activity 2",
      })
    );
    service.send(
      createSetValueAction({
        profileId: "2",
        activityId: activities[1].id,
        value: "Hello from user 2 for activity 2",
      })
    );
    service.send(
      createSetValueAction({
        profileId: "1",
        activityId: activities[1].id,
        value: "Hello from user 1 for activity 2",
      })
    );

    service.send(
      createSetReadyAction({
        profileId: "3",
        activityId: activities[1].id,
      })
    );
    service.send(
      createSetReadyAction({
        profileId: "2",
        activityId: activities[1].id,
      })
    );
    service.send(
      createSetReadyAction({
        profileId: "1",
        activityId: activities[1].id,
      })
    );

    console.log(service.getSnapshot().value, service.getSnapshot().context);
  });
