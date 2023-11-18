import { createMachine, assign, interpret } from "xstate";
import { WorkshopModelInstance } from "../../database";
import {
  createIndividualOnlyState,
  createIndividualAndGroupState,
  createMachineState,
  createIndividualGroupAndReviewState,
  createGroupOnlyOneValueState,
  createIndividualAndGroupOneValueState,
} from "./helpers";
import {
  SessionMachineActions,
  SessionMachineContext,
  JoinAction,
  DisconnectAction,
  ReadyToStartAction,
  SetValueAction,
  SetReadyAction,
  ActivityTimeoutAction,
  ActivityPartTimeoutAction,
  Timeouts,
} from "./types";

export function createSessionMachine({
  states,
  machineName,
  timeouts,
}: {
  states: Parameters<
    typeof createMachine<SessionMachineContext, SessionMachineActions>
  >[0]["states"];
  machineName: string;
  timeouts?: {
    workshopMinuteTimeout?: number;
    activity?: Record<
      string,
      {
        activityMinuteTimeout?: number;
        individualMinuteTimeout?: number;
        groupMinuteTimeout?: number;
        reviewMinuteTimeout?: number;
      }
    >;
  };
}) {
  return createMachine(
    {
      id: machineName,
      context: {
        requiredActiveProfileCount: 3,
        currentActiveProfiles: [],
        readyActiveProfiles: [],
        activityResult: {},
        lastUpdatedTimestamp: null,
        timeouts,
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
            context.currentActiveProfiles.includes(profileId)
              ? context.currentActiveProfiles || []
              : context.currentActiveProfiles.concat(profileId),
          lastUpdatedTimestamp: () => performance.now(),
        }),
        disconnect: assign({
          currentActiveProfiles: (context, { profileId }: DisconnectAction) =>
            context.currentActiveProfiles.filter((id) => id !== profileId),
          lastUpdatedTimestamp: () => performance.now(),
        }),
        readyToStart: assign({
          readyActiveProfiles: (context, { profileId }: ReadyToStartAction) =>
            context.readyActiveProfiles.concat(profileId),
          lastUpdatedTimestamp: () => performance.now(),
        }),
        setValue: assign({
          activityResult: (context, action, { state }) => {
            const { value, profileId, activityId } = action as SetValueAction;
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
          lastUpdatedTimestamp: () => performance.now(),
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
          lastUpdatedTimestamp: () => performance.now(),
        }),
        setReady: assign({
          activityResult: (context, action, { state }) => {
            const setReadyAction = action as SetReadyAction;
            const { profileId, activityId } = setReadyAction;
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
          lastUpdatedTimestamp: () => performance.now(),
        }),
        timeout: assign({
          activityResult: (context, action, { state }) => {
            const states = state!.machine!.config.states!;
            // if (!states) return context.activityResult; < cond
            const timeoutAction = action as
              | ActivityTimeoutAction
              | ActivityPartTimeoutAction;
            const { activityId, type } = timeoutAction;
            const activity = Object.keys(state?.value || {})[0];
            const currentMode = (state?.value as any)[activity] as
              | "individual"
              | "group"
              | "review";

            // if (
            //   !activity ||
            //   currentMode === undefined ||
            //   activityId !== activity ||
            //   (type === "activityTimeout" &&
            //     !context.timeouts?.activity?.[activity]
            //       ?.activityMinuteTimeout) ||
            //   (type === "activityPartTimeout" &&
            //     (currentMode === "individual"
            //       ? !context.timeouts?.activity?.[activity]
            //           ?.individualMinuteTimeout
            //       : currentMode === "group"
            //       ? !context.timeouts?.activity?.[activity]?.groupMinuteTimeout
            //       : !context.timeouts?.activity?.[activity]
            //           ?.reviewMinuteTimeout))
            // ) {
            //   return context.activityResult; <<<< cond
            // }
            const activityStates = states[activityId].states;
            const modes: ("individual" | "group" | "review")[] =
              action.type === "activityPartTimeout"
                ? [currentMode]
                : (Object.keys(activityStates!) as (
                    | "individual"
                    | "group"
                    | "review"
                  )[]);

            let updatedActivityResult = {
              ...context.activityResult,
            };

            for (const mode of modes) {
              let currentActivityResults = context.currentActiveProfiles.map(
                (profileId) => {
                  return (
                    (context.activityResult?.[activity]?.[mode] || []).find(
                      (a) => a.profileId === profileId
                    ) || {
                      profileId,
                      value: "<TIMEOUT_NO_VALUE>",
                      ready: true,
                    }
                  );
                }
              );

              currentActivityResults = currentActivityResults.map((v) => ({
                profileId: v.profileId,
                value: v.value || "<TIMEOUT_NO_VALUE>",
                ready: true,
              }));

              updatedActivityResult = {
                ...updatedActivityResult,
                [activity]: {
                  ...updatedActivityResult[activity],
                  [mode]: currentActivityResults,
                },
              };
            }

            return updatedActivityResult;
          },
          lastUpdatedTimestamp: () => performance.now(),
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

export function createMachineServiceFromWorkshop({
  machineName,
  workshop,
}: {
  machineName: string;
  workshop: WorkshopModelInstance;
}) {
  const activities = workshop.activities!;
  let states = {
    ...createIndividualOnlyState({
      machineName,
      activityName: "startEmotion",
      nextActivityName: "teamName",
    }),
    ...createGroupOnlyOneValueState({
      machineName,
      activityName: "teamName",
      nextActivityName: activities[0].id,
    }),
  };
  const sortedActivities = activities.sort(
    (a, b) => a.sequence_number - b.sequence_number
  );
  const isQuiz = workshop.typeInstance!.name === "Quiz";
  const activityTimeouts: Timeouts["activity"] = {};
  for (const activity of sortedActivities) {
    const duration = activity.getDuration();
    const individualDuration = activity.getIndividualDuration();
    const groupDuration = activity.getGroupDuration();

    if (duration) {
      activityTimeouts[activity.id] = {
        activityMinuteTimeout: duration,
      };
    }
    if (individualDuration) {
      const currentActivityTimeouts = activityTimeouts[activity.id] || {};
      currentActivityTimeouts.individualMinuteTimeout = individualDuration;
    }
    if (groupDuration) {
      const currentActivityTimeouts = activityTimeouts[activity.id] || {};
      currentActivityTimeouts.groupMinuteTimeout = groupDuration;
    }

    const currentActivityIndex = activities.indexOf(activity);
    const nextActivity = activities[currentActivityIndex + 1];
    if (activity.theory) {
      states = {
        ...states,
        ...createIndividualOnlyState({
          machineName,
          activityName: activity.id,
          nextActivityName: nextActivity.id,
        }),
      };
    }
    if (activity.question) {
      states = {
        ...states,
        ...(isQuiz
          ? createIndividualGroupAndReviewState
          : createIndividualAndGroupState)({
          machineName,
          activityName: activity.id,
          nextActivityName: nextActivity.id,
        }),
      };
    }
    if (activity.assignment) {
      states = {
        ...states,
        ...createIndividualOnlyState({
          machineName,
          activityName: activity.id,
          nextActivityName: nextActivity.id,
        }),
      };
    }
    if (activity.conceptualization) {
      states = {
        ...states,
        ...createIndividualAndGroupOneValueState({
          machineName: workshop.id,
          activityName: activity.id,
          nextActivityName: nextActivity.id,
        }),
      };
    }
    if (activity.benchmark) {
      states = {
        ...states,
        ...createIndividualAndGroupState({
          machineName,
          activityName: activity.id,
          nextActivityName: nextActivity.id,
        }),
      };
    }
  }

  states = {
    ...states,
    ...createIndividualOnlyState({
      machineName,
      activityName: "endEmotion",
      nextActivityName: "viewResults",
    }),
  };

  const machineState = createMachineState({
    machineName,
    stateAfterWaiting: "startEmotion",
    states,
  });
  const sessionMachine = createSessionMachine({
    machineName,
    states: machineState,
  });
  const service = interpret(sessionMachine)
    .onTransition((state) => console.log(state))
    .start();
  return service;
}

// getSessionWithWorkshopAndActivities("2624bc0f-71a0-4e2f-a1a7-7bd80cb9ac05")
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

//     service.getSnapshot();

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
//     service.send(createActivityTimeoutAction({ activityId: "startEmotion" }));
//     // service.send(
//     //   createSetValueAction({
//     //     profileId: "1",
//     //     activityId: "startEmotion",
//     //     value: "Great",
//     //   })
//     // );

//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "3",
//     //     activityId: "startEmotion",
//     //   })
//     // );
//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "2",
//     //     activityId: "startEmotion",
//     //   })
//     // );
//     // service.send(
//     //   createSetReadyAction({
//     //     profileId: "1",
//     //     activityId: "startEmotion",
//     //   })
//     // );

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

//     // first activity review ready
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

//     // second activity stuff
//     service.send(
//       createSetValueAction({
//         profileId: "3",
//         activityId: activities[1].id,
//         value: "Hello from user 3 for activity 2",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "2",
//         activityId: activities[1].id,
//         value: "Hello from user 2 for activity 2",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "1",
//         activityId: activities[1].id,
//         value: "Hello from user 1 for activity 2",
//       })
//     );

//     service.send(
//       createSetReadyAction({
//         profileId: "3",
//         activityId: activities[1].id,
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "2",
//         activityId: activities[1].id,
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "1",
//         activityId: activities[1].id,
//       })
//     );

//     // end emotion
//     service.send(
//       createSetValueAction({
//         profileId: "3",
//         activityId: "endEmotion",
//         value: "Good",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "2",
//         activityId: "endEmotion",
//         value: "Better",
//       })
//     );
//     service.send(
//       createSetValueAction({
//         profileId: "1",
//         activityId: "endEmotion",
//         value: "Great",
//       })
//     );

//     service.send(
//       createSetReadyAction({
//         profileId: "3",
//         activityId: "endEmotion",
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "2",
//         activityId: "endEmotion",
//       })
//     );
//     service.send(
//       createSetReadyAction({
//         profileId: "1",
//         activityId: "endEmotion",
//       })
//     );

//     console.log(service.getSnapshot().value, service.getSnapshot().context);
//   });

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
