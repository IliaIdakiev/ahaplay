import { createMachine, assign, interpret, State } from "xstate";

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

const sessionMachine = createMachine(
  {
    id: "sessionMachine",
    context: {
      requiredActiveProfileCount: 3,
      currentActiveProfiles: [],
      readyActiveProfiles: [],
      activityResult: {},
    },
    initial: "waiting",
    states: {
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
              target: "activity-1",
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
      "activity-1": {
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
                  target: "#sessionMachine.activity-2",
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
      "activity-2": {
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
                  target: "#sessionMachine.activity-3",
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
      "activity-3": {
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
                  target: "#sessionMachine.viewResults",
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
      viewResults: {
        type: "final",
      },
    },
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
          context.activityResult[activity][mode].length ===
            context.requiredActiveProfileCount &&
          context.activityResult[activity][mode]
            .filter((val) => val.profileId !== profileId)
            .every((a) => a.ready);
        return isReady;
      },
    },
  }
);

let service = interpret(sessionMachine)
  .onTransition((state) => console.log(state.value, state.context))
  .start();

service.send(createJoinAction({ profileId: "1" }));

const stateAfterProfile1Joined = service.getSnapshot();

service = interpret(sessionMachine)
  .onTransition((state) => console.log(state.value, state.context))
  .start(State.create(stateAfterProfile1Joined));

service.send(createJoinAction({ profileId: "2" }));
service.send(createJoinAction({ profileId: "3" }));

service.send(createReadyToStartAction({ profileId: "1" }));
service.send(createReadyToStartAction({ profileId: "2" }));
service.send(createReadyToStartAction({ profileId: "3" }));

// Activity 1 individual
service.send(
  createSetValueAction({
    profileId: "3",
    activityId: "activity-1",
    value: "213",
  })
);
service.send(
  createSetValueAction({
    profileId: "2",
    activityId: "activity-1",
    value: "213",
  })
);
service.send(
  createSetValueAction({
    profileId: "1",
    activityId: "activity-1",
    value: "213",
  })
);

service.send(
  createSetReadyAction({
    profileId: "3",
    activityId: "activity-1",
  })
);
service.send(
  createSetReadyAction({
    profileId: "2",
    activityId: "activity-1",
  })
);
service.send(
  createSetReadyAction({
    profileId: "1",
    activityId: "activity-1",
  })
);

// Activity 1 group
service.send(
  createSetValueAction({
    profileId: "3",
    activityId: "activity-1",
    value: "213",
  })
);
service.send(
  createSetValueAction({
    profileId: "2",
    activityId: "activity-1",
    value: "213",
  })
);
service.send(
  createSetValueAction({
    profileId: "1",
    activityId: "activity-1",
    value: "213",
  })
);

service.send(
  createSetReadyAction({
    profileId: "3",
    activityId: "activity-1",
  })
);
service.send(
  createSetReadyAction({
    profileId: "2",
    activityId: "activity-1",
  })
);
service.send(
  createSetReadyAction({
    profileId: "1",
    activityId: "activity-1",
  })
);

// Activity 2 group
service.send(
  createSetValueAction({
    profileId: "3",
    activityId: "activity-2",
    value: "213",
  })
);
service.send(
  createSetValueAction({
    profileId: "2",
    activityId: "activity-2",
    value: "213",
  })
);
service.send(
  createSetValueAction({
    profileId: "1",
    activityId: "activity-2",
    value: "213",
  })
);

service.send(
  createSetReadyAction({
    profileId: "3",
    activityId: "activity-2",
  })
);
service.send(
  createSetReadyAction({
    profileId: "2",
    activityId: "activity-2",
  })
);
service.send(
  createSetReadyAction({
    profileId: "1",
    activityId: "activity-2",
  })
);

// Activity 3 group
service.send(
  createSetValueAction({
    profileId: "3",
    activityId: "activity-3",
    value: "213",
  })
);
service.send(
  createSetValueAction({
    profileId: "2",
    activityId: "activity-3",
    value: "213",
  })
);
service.send(
  createSetValueAction({
    profileId: "1",
    activityId: "activity-3",
    value: "213",
  })
);

service.send(
  createSetReadyAction({
    profileId: "3",
    activityId: "activity-3",
  })
);
service.send(
  createSetReadyAction({
    profileId: "2",
    activityId: "activity-3",
  })
);
service.send(
  createSetReadyAction({
    profileId: "1",
    activityId: "activity-3",
  })
);

console.log("-------------------------");
console.log(service.getSnapshot().value);
console.log(service.getSnapshot().context);
console.log("-------------------------");
