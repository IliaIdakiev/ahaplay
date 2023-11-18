import { createSessionMachine } from "./+xstate/convert-workshop-to-machine";
import {
  createGroupOnlyOneValueState,
  createIndividualOnlyState,
  createGroupOnlyState,
  createIndividualAndGroupOneValueState,
  createIndividualAndGroupState,
  createIndividualGroupAndReviewState,
  createIndividualReadyOnlyState,
  createMachineState,
} from "./+xstate/helpers";
import {
  createActivityPartTimeoutAction,
  createJoinAction,
  createMachineService,
  createReadyToStartAction,
  createSetReadyAction,
  createSetValueAction,
} from "./+xstate";
// import { Scheduler } from "./scheduler";
// import { useFakeTimers } from "sinon";

describe("Test machine scheduler", () => {
  const machineName = "testMachine";
  const players = ["player-1", "player-2", "player-3"];
  const workshopMinuteTimeout = 10;
  const timeoutValues = {
    individualOnlyState: {
      activityMinuteTimeout: 0,
      individualMinuteTimeout: 0,
    },
    groupOnlyState: {
      activityMinuteTimeout: 0,
      groupMinuteTimeout: 0,
    },
    individualAndGroupOneValueState: {
      individualMinuteTimeout: 0,
      activityMinuteTimeout: 0,
      groupMinuteTimeout: 0,
    },
    individualAndGroupState: {
      individualMinuteTimeout: 0,
      activityMinuteTimeout: 0,
      groupMinuteTimeout: 0,
    },
    individualGroupAndReviewState: {
      activityMinuteTimeout: 0,
      groupMinuteTimeout: 0,
      reviewMinuteTimeout: 0,
      individualMinuteTimeout: 0,
    },
    individualReadyOnlyState: {
      activityMinuteTimeout: 0,
      individualMinuteTimeout: 0,
    },
    createGroupOnlyOneValueState: {
      activityMinuteTimeout: 0,
      groupMinuteTimeout: 0,
    },
  };
  const states = {
    ...createIndividualOnlyState({
      machineName,
      activityName: "startEmotion",
      nextActivityName: "teamName",
    }),
    ...createGroupOnlyOneValueState({
      machineName,
      activityName: "teamName",
      nextActivityName: "individualOnlyState",
    }),
    ...createIndividualOnlyState({
      machineName,
      activityName: "individualOnlyState",
      nextActivityName: "groupOnlyState",
      get activityMinuteTimeout() {
        return timeoutValues.individualOnlyState.activityMinuteTimeout;
      },
      get individualMinuteTimeout() {
        return timeoutValues.individualOnlyState.individualMinuteTimeout;
      },
    }),
    ...createGroupOnlyState({
      machineName,
      activityName: "groupOnlyState",
      nextActivityName: "individualAndGroupOneValueState",
      get activityMinuteTimeout() {
        return timeoutValues.groupOnlyState.activityMinuteTimeout;
      },
      get groupMinuteTimeout() {
        return timeoutValues.groupOnlyState.groupMinuteTimeout;
      },
    }),
    ...createIndividualAndGroupOneValueState({
      machineName,
      activityName: "individualAndGroupOneValueState",
      nextActivityName: "individualAndGroupState",
      get individualMinuteTimeout() {
        return timeoutValues.individualAndGroupOneValueState
          .individualMinuteTimeout;
      },
      get activityMinuteTimeout() {
        return timeoutValues.individualAndGroupOneValueState
          .activityMinuteTimeout;
      },
      get groupMinuteTimeout() {
        return timeoutValues.individualAndGroupOneValueState.groupMinuteTimeout;
      },
    }),
    ...createIndividualAndGroupState({
      machineName,
      activityName: "individualAndGroupState",
      nextActivityName: "individualGroupAndReviewState",
      get individualMinuteTimeout() {
        return timeoutValues.individualAndGroupState.individualMinuteTimeout;
      },
      get activityMinuteTimeout() {
        return timeoutValues.individualAndGroupState.activityMinuteTimeout;
      },
      get groupMinuteTimeout() {
        return timeoutValues.individualAndGroupState.groupMinuteTimeout;
      },
    }),
    ...createIndividualGroupAndReviewState({
      machineName,
      activityName: "individualGroupAndReviewState",
      nextActivityName: "individualReadyOnlyState",
      get activityMinuteTimeout() {
        return timeoutValues.individualGroupAndReviewState
          .activityMinuteTimeout;
      },
      get groupMinuteTimeout() {
        return timeoutValues.individualGroupAndReviewState.groupMinuteTimeout;
      },
      get reviewMinuteTimeout() {
        return timeoutValues.individualGroupAndReviewState.reviewMinuteTimeout;
      },
      get individualMinuteTimeout() {
        return timeoutValues.individualGroupAndReviewState
          .individualMinuteTimeout;
      },
    }),
    ...createIndividualReadyOnlyState({
      machineName,
      activityName: "individualReadyOnlyState",
      nextActivityName: "groupOnlyOneValueState",
      get activityMinuteTimeout() {
        return timeoutValues.individualReadyOnlyState.activityMinuteTimeout;
      },
      get individualMinuteTimeout() {
        return timeoutValues.individualReadyOnlyState.individualMinuteTimeout;
      },
    }),
    ...createGroupOnlyOneValueState({
      machineName,
      activityName: "groupOnlyOneValueState",
      nextActivityName: "endEmotion",
      get activityMinuteTimeout() {
        return timeoutValues.createGroupOnlyOneValueState.activityMinuteTimeout;
      },
      get groupMinuteTimeout() {
        return timeoutValues.createGroupOnlyOneValueState.groupMinuteTimeout;
      },
    }),
    ...createIndividualOnlyState({
      machineName,
      activityName: "endEmotion",
      nextActivityName: "viewResults",
    }),
  };
  let sessionMachine: ReturnType<typeof createSessionMachine>;
  let sessionMachineService: ReturnType<typeof createMachineService>;

  beforeEach(() => {
    const sessionMachineStates = createMachineState(
      machineName,
      "startEmotion",
      states
    );
    sessionMachine = createSessionMachine({
      machineName,
      states: sessionMachineStates,
    });
    sessionMachineService = createMachineService(sessionMachine);
    players.forEach((profileId) => {
      sessionMachineService.send(createJoinAction({ profileId }));
      sessionMachineService.send(createReadyToStartAction({ profileId }));
    });
    players.forEach((profileId) => {
      sessionMachineService.send(
        createSetValueAction({
          profileId,
          activityId: "startEmotion",
          value: "1",
        })
      );
      sessionMachineService.send(
        createSetReadyAction({ profileId, activityId: "startEmotion" })
      );
    });
    sessionMachineService.send(
      createSetValueAction({
        profileId: "1",
        activityId: "teamName",
        value: "Team 1",
      })
    );
    players.forEach((profileId) => {
      sessionMachineService.send(
        createSetReadyAction({ profileId, activityId: "teamName" })
      );
    });
  });

  it("should test workshop duration timeout", (done) => {
    sessionMachineService.send(
      createActivityPartTimeoutAction({ activityId: "individualOnlyState" })
    );

    done();
    // const scheduler = new Scheduler(
    //   sessionMachineService as any,
    //   workshopMinuteTimeout
    // );
    // const clock = useFakeTimers();
    // delayedFunction((result) => {
    //   // Assert that the callback was called with the expected result
    //   assert.strictEqual(result, "Done");
    //   // Assert that the timer was called after the simulated time has passed
    //   assert.strictEqual(clock.now, 1000);
    //   // Restore the original timers
    //   clock.restore();
    //   // Complete the test
    //   done();
    // });
    // clock.tick(1000);
  });
});
