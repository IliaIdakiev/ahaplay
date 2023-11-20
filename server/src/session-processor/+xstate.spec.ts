import { sessionMachineFactory } from "./+xstate/factories";
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
  createActivityTimeoutAction,
  createJoinAction,
  sessionMachineServiceFactory,
  createReadyToStartAction,
  createSetReadyAction,
  createSetValueAction,
} from "./+xstate";
import { expect } from "chai";

describe("Test machine scheduler", () => {
  const machineName = "testMachine";
  const players = ["player-1", "player-2", "player-3"];
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
  let sessionMachine: ReturnType<typeof sessionMachineFactory>;
  let sessionMachineService: ReturnType<typeof sessionMachineServiceFactory>;

  describe("configurable activities tests", () => {
    beforeEach(() => {
      const sessionMachineStates = createMachineState({
        machineName,
        stateAfterWaiting: "startEmotion",
        states,
      });
      sessionMachine = sessionMachineFactory({
        machineName,
        states: sessionMachineStates,
        timeouts,
      });
      sessionMachineService = sessionMachineServiceFactory(sessionMachine);
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

    it("should test activity part timeout action", (done) => {
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
      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "endEmotion",
          force: false,
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
    });
    it("should test activity part timeout action checks", (done) => {
      sessionMachineService.send(
        createActivityPartTimeoutAction({ activityId: "individualOnlyState" })
      );
      const snapshot1_noChange = sessionMachineService.getSnapshot();

      timeoutValues.activity.individualOnlyState.individualMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityPartTimeoutAction({ activityId: "individualOnlyState" })
      );
      const snapshot1 = sessionMachineService.getSnapshot();

      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "groupOnlyState",
        })
      );

      const snapshot2_noChange = sessionMachineService.getSnapshot();

      timeoutValues.activity.groupOnlyState.groupMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "groupOnlyState",
        })
      );

      const snapshot2 = sessionMachineService.getSnapshot();

      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "individualAndGroupOneValueState",
        })
      );

      const snapshot3_noChange = sessionMachineService.getSnapshot();

      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "individualAndGroupOneValueState",
        })
      );
      const snapshot4_noChange = sessionMachineService.getSnapshot();

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

      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "individualAndGroupState",
        })
      );
      const snapshot5_noChange = sessionMachineService.getSnapshot();
      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "individualAndGroupState",
        })
      );
      const snapshot6_noChange = sessionMachineService.getSnapshot();

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

      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "individualGroupAndReviewState",
        })
      );
      const snapshot7_noChange = sessionMachineService.getSnapshot();
      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "individualGroupAndReviewState",
        })
      );
      const snapshot8_noChange = sessionMachineService.getSnapshot();
      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "individualGroupAndReviewState",
        })
      );
      const snapshot9_noChange = sessionMachineService.getSnapshot();

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

      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "individualReadyOnlyState",
        })
      );
      const snapshot10_noChange = sessionMachineService.getSnapshot();

      timeoutValues.activity.individualReadyOnlyState.individualMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "individualReadyOnlyState",
        })
      );
      const snapshot10 = sessionMachineService.getSnapshot();

      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "groupOnlyOneValueState",
        })
      );
      const snapshot11_noChange = sessionMachineService.getSnapshot();

      timeoutValues.activity.groupOnlyOneValueState.groupMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "groupOnlyOneValueState",
        })
      );
      const snapshot11 = sessionMachineService.getSnapshot();

      sessionMachineService.send(
        createActivityPartTimeoutAction({
          activityId: "endEmotion",
          force: false,
        })
      );
      const snapshot12 = sessionMachineService.getSnapshot();

      expect(snapshot1_noChange.value).to.deep.equal({
        individualOnlyState: "individual",
      });
      expect(snapshot1.value).to.deep.equal({ groupOnlyState: "group" });
      expect(snapshot2_noChange.value).to.deep.equal({
        groupOnlyState: "group",
      });
      expect(snapshot2.value).to.deep.equal({
        individualAndGroupOneValueState: "individual",
      });
      expect(snapshot3_noChange.value).to.deep.equal({
        individualAndGroupOneValueState: "individual",
      });
      expect(snapshot3.value).to.deep.equal({
        individualAndGroupOneValueState: "group",
      });
      expect(snapshot4_noChange.value).to.deep.equal({
        individualAndGroupOneValueState: "individual",
      });
      expect(snapshot4.value).to.deep.equal({
        individualAndGroupState: "individual",
      });
      expect(snapshot5_noChange.value).to.deep.equal({
        individualAndGroupState: "individual",
      });
      expect(snapshot5.value).to.deep.equal({
        individualAndGroupState: "group",
      });
      expect(snapshot6_noChange.value).to.deep.equal({
        individualAndGroupState: "individual",
      });
      expect(snapshot6.value).to.deep.equal({
        individualGroupAndReviewState: "individual",
      });
      expect(snapshot7_noChange.value).to.deep.equal({
        individualGroupAndReviewState: "individual",
      });
      expect(snapshot7.value).to.deep.equal({
        individualGroupAndReviewState: "group",
      });
      expect(snapshot8_noChange.value).to.deep.equal({
        individualGroupAndReviewState: "individual",
      });
      expect(snapshot8.value).to.deep.equal({
        individualGroupAndReviewState: "review",
      });
      expect(snapshot9_noChange.value).to.deep.equal({
        individualGroupAndReviewState: "individual",
      });
      expect(snapshot9.value).to.deep.equal({
        individualReadyOnlyState: "individual",
      });
      expect(snapshot10_noChange.value).to.deep.equal({
        individualReadyOnlyState: "individual",
      });
      expect(snapshot10.value).to.deep.equal({
        groupOnlyOneValueState: "group",
      });
      expect(snapshot11_noChange.value).to.deep.equal({
        groupOnlyOneValueState: "group",
      });
      expect(snapshot11.value).to.deep.equal({ endEmotion: "individual" });
      expect(snapshot12.value).to.deep.equal({ endEmotion: "individual" });

      done();
    });
    it("should test activity timeout action", (done) => {
      timeoutValues.activity.individualOnlyState.activityMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityTimeoutAction({ activityId: "individualOnlyState" })
      );
      const snapshot1 = sessionMachineService.getSnapshot();

      timeoutValues.activity.groupOnlyState.activityMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "groupOnlyState",
        })
      );

      const snapshot2 = sessionMachineService.getSnapshot();

      timeoutValues.activity.individualAndGroupOneValueState.activityMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "individualAndGroupOneValueState",
        })
      );

      const snapshot3 = sessionMachineService.getSnapshot();

      timeoutValues.activity.individualAndGroupState.activityMinuteTimeout = 1;

      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "individualAndGroupState",
        })
      );
      const snapshot4 = sessionMachineService.getSnapshot();

      timeoutValues.activity.individualGroupAndReviewState.activityMinuteTimeout = 1;

      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "individualGroupAndReviewState",
        })
      );
      const snapshot5 = sessionMachineService.getSnapshot();

      timeoutValues.activity.individualReadyOnlyState.activityMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "individualReadyOnlyState",
        })
      );
      const snapshot6 = sessionMachineService.getSnapshot();

      timeoutValues.activity.groupOnlyOneValueState.activityMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "groupOnlyOneValueState",
        })
      );
      const snapshot7 = sessionMachineService.getSnapshot();
      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "endEmotion",
        })
      );
      const snapshot8 = sessionMachineService.getSnapshot();

      expect(snapshot1.value).to.deep.equal({ groupOnlyState: "group" });
      expect(snapshot2.value).to.deep.equal({
        individualAndGroupOneValueState: "individual",
      });
      expect(snapshot3.value).to.deep.equal({
        individualAndGroupState: "individual",
      });
      expect(snapshot4.value).to.deep.equal({
        individualGroupAndReviewState: "individual",
      });
      expect(snapshot5.value).to.deep.equal({
        individualReadyOnlyState: "individual",
      });
      expect(snapshot6.value).to.deep.equal({
        groupOnlyOneValueState: "group",
      });
      expect(snapshot7.value).to.deep.equal({
        endEmotion: "individual",
      });
      expect(snapshot8.value).to.deep.equal({ endEmotion: "individual" });

      done();
    });
    it("should test activity timeout action checks", (done) => {
      sessionMachineService.send(
        createActivityTimeoutAction({ activityId: "individualOnlyState" })
      );
      const snapshot1_noChange = sessionMachineService.getSnapshot();

      timeoutValues.activity.individualOnlyState.activityMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityTimeoutAction({ activityId: "individualOnlyState" })
      );
      const snapshot1 = sessionMachineService.getSnapshot();

      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "groupOnlyState",
        })
      );

      const snapshot2_noChange = sessionMachineService.getSnapshot();

      timeoutValues.activity.groupOnlyState.activityMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "groupOnlyState",
        })
      );

      const snapshot2 = sessionMachineService.getSnapshot();

      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "individualAndGroupOneValueState",
        })
      );

      const snapshot3_noChange = sessionMachineService.getSnapshot();

      timeoutValues.activity.individualAndGroupOneValueState.activityMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "individualAndGroupOneValueState",
        })
      );

      const snapshot3 = sessionMachineService.getSnapshot();

      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "individualAndGroupState",
        })
      );
      const snapshot4_noChange = sessionMachineService.getSnapshot();

      timeoutValues.activity.individualAndGroupState.activityMinuteTimeout = 1;

      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "individualAndGroupState",
        })
      );
      const snapshot4 = sessionMachineService.getSnapshot();

      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "individualGroupAndReviewState",
        })
      );
      const snapshot5_noChange = sessionMachineService.getSnapshot();

      timeoutValues.activity.individualGroupAndReviewState.activityMinuteTimeout = 1;

      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "individualGroupAndReviewState",
        })
      );
      const snapshot5 = sessionMachineService.getSnapshot();

      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "individualReadyOnlyState",
        })
      );
      const snapshot6_noChange = sessionMachineService.getSnapshot();

      timeoutValues.activity.individualReadyOnlyState.activityMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "individualReadyOnlyState",
        })
      );
      const snapshot6 = sessionMachineService.getSnapshot();

      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "groupOnlyOneValueState",
        })
      );
      const snapshot7_noChange = sessionMachineService.getSnapshot();

      timeoutValues.activity.groupOnlyOneValueState.activityMinuteTimeout = 1;
      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "groupOnlyOneValueState",
        })
      );
      const snapshot7 = sessionMachineService.getSnapshot();
      sessionMachineService.send(
        createActivityTimeoutAction({
          activityId: "endEmotion",
        })
      );
      const snapshot8 = sessionMachineService.getSnapshot();

      expect(snapshot1_noChange.value).to.deep.equal({
        individualOnlyState: "individual",
      });
      expect(snapshot1.value).to.deep.equal({ groupOnlyState: "group" });
      expect(snapshot2_noChange.value).to.deep.equal({
        groupOnlyState: "group",
      });
      expect(snapshot2.value).to.deep.equal({
        individualAndGroupOneValueState: "individual",
      });
      expect(snapshot3_noChange.value).to.deep.equal({
        individualAndGroupOneValueState: "individual",
      });
      expect(snapshot3.value).to.deep.equal({
        individualAndGroupState: "individual",
      });
      expect(snapshot4_noChange.value).to.deep.equal({
        individualAndGroupState: "individual",
      });
      expect(snapshot4.value).to.deep.equal({
        individualGroupAndReviewState: "individual",
      });
      expect(snapshot5_noChange.value).to.deep.equal({
        individualGroupAndReviewState: "individual",
      });
      expect(snapshot5.value).to.deep.equal({
        individualReadyOnlyState: "individual",
      });
      expect(snapshot6_noChange.value).to.deep.equal({
        individualReadyOnlyState: "individual",
      });
      expect(snapshot6.value).to.deep.equal({
        groupOnlyOneValueState: "group",
      });
      expect(snapshot7_noChange.value).to.deep.equal({
        groupOnlyOneValueState: "group",
      });
      expect(snapshot7.value).to.deep.equal({
        endEmotion: "individual",
      });
      expect(snapshot8.value).to.deep.equal({ endEmotion: "individual" });

      done();
    });
  });
});
