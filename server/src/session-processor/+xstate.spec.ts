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
  Timeouts,
  createActivityPartTimeoutAction,
  createJoinAction,
  createMachineService,
  createReadyToStartAction,
  createSetReadyAction,
  createSetValueAction,
} from "./+xstate";
import { expect } from "chai";

describe("Test machine scheduler", () => {
  const machineName = "testMachine";
  const players = ["player-1", "player-2", "player-3"];
  const workshopMinuteTimeout = 10;
  const timeoutValues = {
    workshopMinuteTimeout: 0,
    activity: {
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
        groupMinuteTimeout: 0,
        activityMinuteTimeout: 0,
      },
      individualAndGroupState: {
        individualMinuteTimeout: 0,
        groupMinuteTimeout: 0,
        activityMinuteTimeout: 0,
      },
      individualGroupAndReviewState: {
        individualMinuteTimeout: 0,
        groupMinuteTimeout: 0,
        reviewMinuteTimeout: 0,
        activityMinuteTimeout: 0,
      },
      individualReadyOnlyState: {
        individualMinuteTimeout: 0,
        activityMinuteTimeout: 0,
      },
      groupOnlyOneValueState: {
        groupMinuteTimeout: 0,
        activityMinuteTimeout: 0,
      },
    },
  };

  const timeouts: Timeouts = {
    get workshopMinuteTimeout() {
      return timeoutValues.workshopMinuteTimeout;
    },
    activity: {
      individualOnlyState: {
        get activityMinuteTimeout() {
          return timeoutValues.activity!.individualOnlyState
            .activityMinuteTimeout;
        },
        get individualMinuteTimeout() {
          return timeoutValues.activity!.individualOnlyState
            .individualMinuteTimeout;
        },
      },
      groupOnlyState: {
        get activityMinuteTimeout() {
          return timeoutValues.activity!.groupOnlyState.activityMinuteTimeout;
        },
        get groupMinuteTimeout() {
          return timeoutValues.activity!.groupOnlyState.groupMinuteTimeout;
        },
      },
      individualAndGroupOneValueState: {
        get individualMinuteTimeout() {
          return timeoutValues.activity!.individualAndGroupOneValueState
            .individualMinuteTimeout;
        },
        get groupMinuteTimeout() {
          return timeoutValues.activity!.individualAndGroupOneValueState
            .groupMinuteTimeout;
        },
        get activityMinuteTimeout() {
          return timeoutValues.activity!.individualAndGroupOneValueState
            .activityMinuteTimeout;
        },
      },
      individualAndGroupState: {
        get individualMinuteTimeout() {
          return timeoutValues.activity!.individualAndGroupState
            .individualMinuteTimeout;
        },
        get groupMinuteTimeout() {
          return timeoutValues.activity!.individualAndGroupState
            .groupMinuteTimeout;
        },
        get activityMinuteTimeout() {
          return timeoutValues.activity!.individualAndGroupState
            .activityMinuteTimeout;
        },
      },
      individualGroupAndReviewState: {
        get individualMinuteTimeout() {
          return timeoutValues.activity!.individualGroupAndReviewState
            .individualMinuteTimeout;
        },
        get groupMinuteTimeout() {
          return timeoutValues.activity!.individualGroupAndReviewState
            .groupMinuteTimeout;
        },
        get reviewMinuteTimeout() {
          return timeoutValues.activity!.individualGroupAndReviewState
            .reviewMinuteTimeout;
        },
        get activityMinuteTimeout() {
          return timeoutValues.activity!.individualGroupAndReviewState
            .activityMinuteTimeout;
        },
      },
      individualReadyOnlyState: {
        get individualMinuteTimeout() {
          return timeoutValues.activity!.individualReadyOnlyState
            .individualMinuteTimeout;
        },
        get activityMinuteTimeout() {
          return timeoutValues.activity!.individualReadyOnlyState
            .activityMinuteTimeout;
        },
      },
      groupOnlyOneValueState: {
        get groupMinuteTimeout() {
          return timeoutValues.activity!.groupOnlyOneValueState
            .groupMinuteTimeout;
        },
        get activityMinuteTimeout() {
          return timeoutValues.activity!.groupOnlyOneValueState
            .activityMinuteTimeout;
        },
      },
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
    }),
    ...createGroupOnlyState({
      machineName,
      activityName: "groupOnlyState",
      nextActivityName: "individualAndGroupOneValueState",
    }),
    ...createIndividualAndGroupOneValueState({
      machineName,
      activityName: "individualAndGroupOneValueState",
      nextActivityName: "individualAndGroupState",
    }),
    ...createIndividualAndGroupState({
      machineName,
      activityName: "individualAndGroupState",
      nextActivityName: "individualGroupAndReviewState",
    }),
    ...createIndividualGroupAndReviewState({
      machineName,
      activityName: "individualGroupAndReviewState",
      nextActivityName: "individualReadyOnlyState",
    }),
    ...createIndividualReadyOnlyState({
      machineName,
      activityName: "individualReadyOnlyState",
      nextActivityName: "groupOnlyOneValueState",
    }),
    ...createGroupOnlyOneValueState({
      machineName,
      activityName: "groupOnlyOneValueState",
      nextActivityName: "endEmotion",
    }),
    ...createIndividualOnlyState({
      machineName,
      activityName: "endEmotion",
      nextActivityName: "viewResults",
    }),
  };
  let sessionMachine: ReturnType<typeof createSessionMachine>;
  let sessionMachineService: ReturnType<typeof createMachineService>;

  describe("dynamic activities tests", () => {
    beforeEach(() => {
      const sessionMachineStates = createMachineState({
        machineName,
        stateAfterWaiting: "startEmotion",
        states,
      });
      sessionMachine = createSessionMachine({
        machineName,
        states: sessionMachineStates,
        timeouts,
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
      timeoutValues.activity.individualOnlyState.individualMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityPartTimeoutAction({ activityId: "individualOnlyState" })
      );
      const snapshot1 = sessionMachineService.getSnapshot();

      timeoutValues.activity.groupOnlyState.groupMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "groupOnlyState",
        })
      );

      const snapshot2 = sessionMachineService.getSnapshot();

      timeoutValues.activity.individualAndGroupOneValueState.individualMinuteTimeout = 1;
      timeoutValues.activity.individualAndGroupOneValueState.groupMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "individualAndGroupOneValueState",
        })
      );

      const snapshot3 = sessionMachineService.getSnapshot();

      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "individualAndGroupOneValueState",
        })
      );
      const snapshot4 = sessionMachineService.getSnapshot();

      timeoutValues.activity.individualAndGroupState.individualMinuteTimeout = 1;
      timeoutValues.activity.individualAndGroupState.groupMinuteTimeout = 1;

      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "individualAndGroupState",
        })
      );
      const snapshot5 = sessionMachineService.getSnapshot();
      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "individualAndGroupState",
        })
      );
      const snapshot6 = sessionMachineService.getSnapshot();

      timeoutValues.activity.individualGroupAndReviewState.individualMinuteTimeout = 1;
      timeoutValues.activity.individualGroupAndReviewState.groupMinuteTimeout = 1;
      timeoutValues.activity.individualGroupAndReviewState.reviewMinuteTimeout = 1;

      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "individualGroupAndReviewState",
        })
      );
      const snapshot7 = sessionMachineService.getSnapshot();
      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "individualGroupAndReviewState",
        })
      );
      const snapshot8 = sessionMachineService.getSnapshot();
      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "individualGroupAndReviewState",
        })
      );
      const snapshot9 = sessionMachineService.getSnapshot();

      timeoutValues.activity.individualReadyOnlyState.individualMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "individualReadyOnlyState",
        })
      );
      const snapshot10 = sessionMachineService.getSnapshot();
      timeoutValues.activity.groupOnlyOneValueState.groupMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "groupOnlyOneValueState",
        })
      );
      const snapshot11 = sessionMachineService.getSnapshot();
      timeoutValues.activity.groupOnlyOneValueState.groupMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "endEmotion",
        })
      );
      const snapshot12 = sessionMachineService.getSnapshot();

      expect(snapshot1.value).to.deep.equal({ groupOnlyState: "group" });
      expect(snapshot2.value).to.deep.equal({
        individualAndGroupOneValueState: "individual",
      });
      expect(snapshot3.value).to.deep.equal({
        individualAndGroupOneValueState: "group",
      });
      expect(snapshot4.value).to.deep.equal({
        individualAndGroupState: "individual",
      });
      expect(snapshot5.value).to.deep.equal({
        individualAndGroupState: "group",
      });
      expect(snapshot6.value).to.deep.equal({
        individualGroupAndReviewState: "individual",
      });
      expect(snapshot7.value).to.deep.equal({
        individualGroupAndReviewState: "group",
      });
      expect(snapshot8.value).to.deep.equal({
        individualGroupAndReviewState: "review",
      });
      expect(snapshot9.value).to.deep.equal({
        individualReadyOnlyState: "individual",
      });
      expect(snapshot10.value).to.deep.equal({
        groupOnlyOneValueState: "group",
      });
      expect(snapshot11.value).to.deep.equal({ endEmotion: "individual" });
      expect(snapshot12.value).to.deep.equal({ endEmotion: "individual" });

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
});
