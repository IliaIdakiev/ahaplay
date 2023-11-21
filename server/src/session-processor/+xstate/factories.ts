import { createMachine, assign, State, interpret } from "xstate";
import {
  SessionMachineContext,
  SessionMachineActions,
  JoinAction,
  DisconnectAction,
  ReadyToStartAction,
  SetValueAction,
  SetReadyAction,
  ActivityTimeoutAction,
  ActivityPartTimeoutAction,
  SessionMachineSnapshot,
  Timeouts,
  SessionMachine,
} from "./types";
import { WorkshopModelInstance, ActivityModelInstance } from "../../database";
import {
  createIndividualOnlyState,
  createGroupOnlyOneValueState,
  createIndividualGroupAndReviewState,
  createIndividualAndGroupState,
  createIndividualAndGroupOneValueState,
  createMachineState,
} from "./helpers";

export function sessionMachineFactory({
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
      // predictableActionArguments: true,
      context: {
        requiredActiveProfileCount: 1,
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
            const mode = (state?.value as any)?.[activity] as
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
          lastUpdatedTimestamp: () => performance.now(),
        }),
        timeout: assign({
          activityResult: (context, action, { state }) => {
            const states = state!.machine!.config.states;
            const timeoutAction = action as
              | ActivityTimeoutAction
              | ActivityPartTimeoutAction;
            const { activityId } = timeoutAction;
            const activity = Object.keys(state?.value || {})[0];
            const currentMode = (state?.value as any)[activity] as
              | "individual"
              | "group"
              | "review";

            const activityStates = states![activityId].states;
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
        timeoutCheck: (context, action, { state }) => {
          const states = state?.machine?.config.states;
          if (!states) return false;
          const timeoutAction = action as
            | ActivityTimeoutAction
            | ActivityPartTimeoutAction;
          const { activityId, type, force = false } = timeoutAction;
          const activity = Object.keys(state?.value || {})[0];
          const currentMode = (state?.value as any)[activity] as
            | "individual"
            | "group"
            | "review"
            | undefined;

          if (
            !activity ||
            currentMode === undefined ||
            activityId !== activity ||
            (type === "activityTimeout" &&
              !context.timeouts?.activity?.[activity]?.activityMinuteTimeout &&
              force === false) ||
            (type === "activityPartTimeout" &&
              (currentMode === "individual"
                ? !context.timeouts?.activity?.[activity]
                    ?.individualMinuteTimeout
                : currentMode === "group"
                ? !context.timeouts?.activity?.[activity]?.groupMinuteTimeout
                : !context.timeouts?.activity?.[activity]
                    ?.reviewMinuteTimeout) &&
              force === false)
          ) {
            return false;
          }
          return true;
        },
      },
    }
  );
}

export function sessionMachineServiceFactory(
  machine: SessionMachine,
  serviceSnapshot?: SessionMachineSnapshot | undefined | null
) {
  const initialState = serviceSnapshot ? State.create(serviceSnapshot) : null;

  const service = interpret(machine).onTransition((state) =>
    console.log(state.value, state.context)
  );
  if (!initialState) return service.start();
  return service.start(initialState);
}

export function sessionMachineServiceFromWorkshopFactory({
  machineName,
  workshop,
  snapshot,
}: {
  machineName: string;
  workshop: WorkshopModelInstance;
  snapshot?: SessionMachineSnapshot | undefined | null;
}) {
  const activities = workshop.activities!;
  const sortedActivities = activities
    .slice()
    .sort((a, b) => a.sequence_number - b.sequence_number);
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
    const nextActivity = activities[currentActivityIndex + 1] as
      | ActivityModelInstance
      | undefined;
    if (activity.theory) {
      states = {
        ...states,
        ...createIndividualOnlyState({
          machineName,
          activityName: activity.id,
          nextActivityName: nextActivity?.id,
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
          nextActivityName: nextActivity?.id,
        }),
      };
    }
    if (activity.assignment) {
      states = {
        ...states,
        ...createIndividualOnlyState({
          machineName,
          activityName: activity.id,
          nextActivityName: nextActivity?.id,
        }),
      };
    }
    if (activity.conceptualization) {
      states = {
        ...states,
        ...createIndividualAndGroupOneValueState({
          machineName: workshop.id,
          activityName: activity.id,
          nextActivityName: nextActivity?.id,
        }),
      };
    }
    if (activity.benchmark) {
      states = {
        ...states,
        ...createIndividualAndGroupState({
          machineName,
          activityName: activity.id,
          nextActivityName: nextActivity?.id,
        }),
      };
    }
    if (activity.survey) {
      states = {
        ...states,
        ...createIndividualOnlyState({
          machineName,
          activityName: activity.id,
          nextActivityName: nextActivity?.id,
        }),
      };
    }
    if (activity.action) {
      states = {
        ...states,
        ...createIndividualAndGroupState({
          // maybe GroupOneValue
          machineName,
          activityName: activity.id,
          nextActivityName: nextActivity?.id,
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
  const sessionMachine = sessionMachineFactory({
    machineName,
    states: machineState,
  });
  return sessionMachineServiceFactory(sessionMachine, snapshot || null);
}
