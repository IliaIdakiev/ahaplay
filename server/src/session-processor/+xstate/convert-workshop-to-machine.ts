import { createMachine, assign, interpret } from "xstate";
import { WorkshopModelInstance } from "../../database";
import {
  createIndividualOnlyState,
  createIndividualAndGroupState,
  createMachineState,
  getSessionWithWorkshopAndActivities,
  createIndividualGroupAndReviewState,
  createGroupOnlyOneValueState,
} from "./helpers";

interface SessionMachineContext {
  requiredActiveProfileCount: number;
  currentActiveProfiles: string[];
  readyActiveProfiles: string[];
  activityResult: Record<
    string,
    Record<
      "individual" | "group" | "review",
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
function createActivityTimeoutAction(data: { activityId: string }) {
  return { type: "activityTimeout" as const, ...data };
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

type ActivityTimeoutAction = ReturnType<typeof createActivityTimeoutAction>;
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
  | SetReadyAction
  | ActivityTimeoutAction;

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
                ...(context.activityResult[activity] || {}),
                [mode]: currentActivityResults,
              },
            };
          },
        }),
        setOneValue: assign({
          activityResult: (context, action, { state }) => {
            if (action.type === "setValue") {
              return context.activityResult;
            }
            const { value, profileId, activityId } =
              action as unknown as SetValueAction;
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
            if (
              !currentActivityResults.find((a) => a.profileId === profileId)
            ) {
              currentActivityResults = currentActivityResults.concat({
                profileId,
                value,
                ready: false,
              });
            }

            return {
              ...context.activityResult,
              [activity]: {
                ...(context.activityResult[activity] || {}),
                [mode]: currentActivityResults.map((a) => ({
                  ...a,
                  value,
                  ready: false,
                })),
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
              | "review"
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
        activityTimeout: assign({
          activityResult: (context, data: ActivityTimeoutAction, { state }) => {
            const { activityId } = data;
            const activity = Object.keys(state?.value || {})[0];
            const mode = (state?.value as any)[activity] as
              | "individual"
              | "group"
              | "review"
              | undefined;

            if (!activity || mode === undefined || activityId !== activity) {
              return context.activityResult;
            }

            let currentActivityResults = context.currentActiveProfiles.map(
              (profileId) => {
                return (
                  (context.activityResult?.[activity]?.[mode] || []).find(
                    (a) => a.profileId === profileId
                  ) || { profileId, value: "<TIMEOUT_NO_VALUE>", ready: true }
                );
              }
            );

            currentActivityResults = currentActivityResults.map((v) => ({
              profileId: v.profileId,
              value: v.value || "<TIMEOUT_NO_VALUE>",
              ready: true,
            }));

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
        isReadyToStart: (context, action) =>
          action &&
          "profileId" in action &&
          context.readyActiveProfiles.concat(action.profileId).length ===
            context.requiredActiveProfileCount,
        isReadyToForNextStep: (context, action, { state }) => {
          if (!("profileId" in action)) {
            return action.type === "activityTimeout";
          }
          const activity = Object.keys(state.value)[0];
          const mode = (state.value as any)[activity] as
            | "individual"
            | "group"
            | "review";
          const otherValues =
            context.activityResult?.[activity]?.[mode]?.filter(
              (val) => val.profileId !== action.profileId
            ) || [];
          const isReady =
            otherValues.length === context.requiredActiveProfileCount - 1 &&
            otherValues.every((a) => a.ready);

          return isReady;
        },
      },
    }
  );
}

function convertWorkshopToMachine(
  machineName: string,
  workshop: WorkshopModelInstance
) {
  const activities = workshop.activities!;
  let states = {
    ...createIndividualOnlyState(machineName, "startEmotion", "teamName"),
    ...createGroupOnlyOneValueState(machineName, "teamName", activities[0]),
  };
  const sortedActivities = activities.sort(
    (a, b) => a.sequence_number - b.sequence_number
  );
  const isQuiz = workshop.typeInstance!.name === "Quiz";
  for (const activity of sortedActivities) {
    const currentActivityIndex = activities.indexOf(activity);
    const nextActivity = activities[currentActivityIndex + 1];
    if (activity.theory) {
      // create individual part only
      states = {
        ...states,
        ...createIndividualOnlyState(workshop.id, activity, nextActivity),
      };
    }
    if (activity.question) {
      // create individual and group part + third part that explains the answers
      states = {
        ...states,
        ...(isQuiz
          ? createIndividualGroupAndReviewState
          : createIndividualAndGroupState)(workshop.id, activity, nextActivity),
      };
    }
    if (activity.assignment) {
      // create individual part only
      states = {
        ...states,
        ...createIndividualOnlyState(workshop.id, activity, nextActivity),
      };
    }
    if (activity.conceptualization) {
      // create individual and group part
      states = {
        ...states,
        ...createIndividualAndGroupState(workshop.id, activity, nextActivity),
      };
    }
    if (activity.benchmark) {
      // create individual and group part
      states = {
        ...states,
        ...createIndividualAndGroupState(workshop.id, activity, nextActivity),
      };
    }
  }

  states = {
    ...states,
    ...createIndividualOnlyState(machineName, "endEmotion", "viewResults"),
  };

  const machineState = createMachineState(machineName, "startEmotion", states);
  return createSessionMachine(machineState, machineName);
}

getSessionWithWorkshopAndActivities("2624bc0f-71a0-4e2f-a1a7-7bd80cb9ac05")
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

    // start emotion
    service.send(
      createSetValueAction({
        profileId: "3",
        activityId: "startEmotion",
        value: "Good",
      })
    );
    service.send(
      createSetValueAction({
        profileId: "2",
        activityId: "startEmotion",
        value: "Better",
      })
    );
    service.send(createActivityTimeoutAction({ activityId: "startEmotion" }));
    // service.send(
    //   createSetValueAction({
    //     profileId: "1",
    //     activityId: "startEmotion",
    //     value: "Great",
    //   })
    // );

    // service.send(
    //   createSetReadyAction({
    //     profileId: "3",
    //     activityId: "startEmotion",
    //   })
    // );
    // service.send(
    //   createSetReadyAction({
    //     profileId: "2",
    //     activityId: "startEmotion",
    //   })
    // );
    // service.send(
    //   createSetReadyAction({
    //     profileId: "1",
    //     activityId: "startEmotion",
    //   })
    // );

    // set team name
    service.send(
      createSetValueAction({
        profileId: "3",
        activityId: "teamName",
        value: "Good team",
      })
    );
    service.send(
      createSetValueAction({
        profileId: "2",
        activityId: "teamName",
        value: "Better team",
      })
    );
    service.send(
      createSetValueAction({
        profileId: "1",
        activityId: "teamName",
        value: "The greatest team",
      })
    );

    service.send(
      createSetReadyAction({
        profileId: "3",
        activityId: "teamName",
      })
    );
    service.send(
      createSetReadyAction({
        profileId: "2",
        activityId: "teamName",
      })
    );
    service.send(
      createSetReadyAction({
        profileId: "1",
        activityId: "teamName",
      })
    );

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

    // first activity review ready
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

    // end emotion
    service.send(
      createSetValueAction({
        profileId: "3",
        activityId: "endEmotion",
        value: "Good",
      })
    );
    service.send(
      createSetValueAction({
        profileId: "2",
        activityId: "endEmotion",
        value: "Better",
      })
    );
    service.send(
      createSetValueAction({
        profileId: "1",
        activityId: "endEmotion",
        value: "Great",
      })
    );

    service.send(
      createSetReadyAction({
        profileId: "3",
        activityId: "endEmotion",
      })
    );
    service.send(
      createSetReadyAction({
        profileId: "2",
        activityId: "endEmotion",
      })
    );
    service.send(
      createSetReadyAction({
        profileId: "1",
        activityId: "endEmotion",
      })
    );

    console.log(service.getSnapshot().value, service.getSnapshot().context);
  });

// getSessionWithWorkshopAndActivities("6bd51789-5a92-4475-9ba7-cd2750cbcaa0")
//   .then(
//     (session) =>
//       [
//         convertWorkshopToMachine(session!.workshop!.id, session!.workshop!),
//         session!,
//       ] as const
//   )
//   .then(([machine, session]) => {
//     const activities = session.workshop!.activities!;
//     let service = interpret(machine)
//       .onTransition((state) => console.log(state.value, state.context))
//       .start();

//     service.send(createJoinAction({ profileId: "1" }));
//     service.send(createJoinAction({ profileId: "2" }));
//     service.send(createJoinAction({ profileId: "3" }));

//     service.send(createReadyToStartAction({ profileId: "1" }));
//     service.send(createReadyToStartAction({ profileId: "2" }));
//     service.send(createReadyToStartAction({ profileId: "3" }));

//     // start emotion
//     service.send(
//       createSetValueAction({
//         profileId: "3",
//         activityId: "startEmotion",
//         value: "Good",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "2",
//         activityId: "startEmotion",
//         value: "Better",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "1",
//         activityId: "startEmotion",
//         value: "Great",
//       })
//     );

//     service.send(
//       createSetReadyAction({
//         profileId: "3",
//         activityId: "startEmotion",
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "2",
//         activityId: "startEmotion",
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "1",
//         activityId: "startEmotion",
//       })
//     );

//     // set team name
//     service.send(
//       createSetValueAction({
//         profileId: "3",
//         activityId: "teamName",
//         value: "Good team",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "2",
//         activityId: "teamName",
//         value: "Better team",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "1",
//         activityId: "teamName",
//         value: "The greatest team",
//       })
//     );

//     service.send(
//       createSetReadyAction({
//         profileId: "3",
//         activityId: "teamName",
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "2",
//         activityId: "teamName",
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "1",
//         activityId: "teamName",
//       })
//     );

//     // first activity stuff
//     service.send(
//       createSetValueAction({
//         profileId: "3",
//         activityId: activities[0].id,
//         value: "Hello from user 3 for first activity",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "2",
//         activityId: activities[0].id,
//         value: "Hello from user 2 for first activity",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "1",
//         activityId: activities[0].id,
//         value: "Hello from user 1 for first activity",
//       })
//     );

//     service.send(
//       createSetReadyAction({
//         profileId: "3",
//         activityId: activities[0].id,
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "2",
//         activityId: activities[0].id,
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "1",
//         activityId: activities[0].id,
//       })
//     );

//     service.send(
//       createSetValueAction({
//         profileId: "3",
//         activityId: activities[0].id,
//         value: "Hello from user 3 for first activity",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "2",
//         activityId: activities[0].id,
//         value: "Hello from user 2 for first activity",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "1",
//         activityId: activities[0].id,
//         value: "Hello from user 1 for first activity",
//       })
//     );

//     service.send(
//       createSetReadyAction({
//         profileId: "3",
//         activityId: activities[0].id,
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "2",
//         activityId: activities[0].id,
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "1",
//         activityId: activities[0].id,
//       })
//     );

//     // // first activity review ready
//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "3",
//     //     activityId: activities[0].id,
//     //   })
//     // );
//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "2",
//     //     activityId: activities[0].id,
//     //   })
//     // );
//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "1",
//     //     activityId: activities[0].id,
//     //   })
//     // );

//     // // second activity stuff
//     // service.send(
//     //   createSetValueAction({
//     //     profileId: "3",
//     //     activityId: activities[1].id,
//     //     value: "Hello from user 3 for activity 2",
//     //   })
//     // );
//     // service.send(
//     //   createSetValueAction({
//     //     profileId: "2",
//     //     activityId: activities[1].id,
//     //     value: "Hello from user 2 for activity 2",
//     //   })
//     // );
//     // service.send(
//     //   createSetValueAction({
//     //     profileId: "1",
//     //     activityId: activities[1].id,
//     //     value: "Hello from user 1 for activity 2",
//     //   })
//     // );

//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "3",
//     //     activityId: activities[1].id,
//     //   })
//     // );
//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "2",
//     //     activityId: activities[1].id,
//     //   })
//     // );
//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "1",
//     //     activityId: activities[1].id,
//     //   })
//     // );

//     // // end emotion
//     // service.send(
//     //   createSetValueAction({
//     //     profileId: "3",
//     //     activityId: "endEmotion",
//     //     value: "Good",
//     //   })
//     // );
//     // service.send(
//     //   createSetValueAction({
//     //     profileId: "2",
//     //     activityId: "endEmotion",
//     //     value: "Better",
//     //   })
//     // );
//     // service.send(
//     //   createSetValueAction({
//     //     profileId: "1",
//     //     activityId: "endEmotion",
//     //     value: "Great",
//     //   })
//     // );

//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "3",
//     //     activityId: "endEmotion",
//     //   })
//     // );
//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "2",
//     //     activityId: "endEmotion",
//     //   })
//     // );
//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "1",
//     //     activityId: "endEmotion",
//     //   })
//     // );

//     console.log(service.getSnapshot().value, service.getSnapshot().context);
//   });
