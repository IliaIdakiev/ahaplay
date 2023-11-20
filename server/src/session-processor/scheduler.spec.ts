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
  createMachineService,
  createReadyToStartAction,
  createSetReadyAction,
  createSetValueAction,
} from "./+xstate";
import { Scheduler } from "./scheduler";
import { useFakeTimers, stub, SinonFakeTimers, spy } from "sinon";
import { minutesToMilliseconds } from "date-fns";
import { expect } from "chai";

describe.only("Test machine scheduler", () => {
  const machineName = "testMachine";
  const players = ["player-1", "player-2", "player-3"];
  const workshopDuration = 10;
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
  let sessionMachineService: ReturnType<typeof createMachineService>;
  let scheduler: Scheduler | null;

  describe("scheduler tests", () => {
    let clock: SinonFakeTimers;
    beforeEach(() => {
      clock = useFakeTimers();
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
    afterEach(() => {
      scheduler = null;
      clock.restore();
    });

    it("should test workshop timeout", (done) => {
      scheduler = new Scheduler(sessionMachineService as any, workshopDuration);
      const getSnapshotStub = stub(sessionMachineService, "getSnapshot");
      const snapshotValue = { value: { individualOnlyState: "individual" } };
      getSnapshotStub.callsFake(() => snapshotValue as any);

      const workshopTimeoutCallbackSpy = spy();
      scheduler.on("workshopTimeout", workshopTimeoutCallbackSpy);

      const activityPartTimeoutCallbackSpy = spy();
      scheduler.on("activityPartTimeout", activityPartTimeoutCallbackSpy);

      const activityTimeoutCallbackSpy = spy();
      scheduler.on("activityTimeout", activityTimeoutCallbackSpy);

      const sendStub = stub(sessionMachineService, "send");
      const returnValues: any[] = [
        { value: { groupOnlyState: "group" } },
        { value: { individualAndGroupOneValueState: "individual" } },
        { value: { individualAndGroupState: "individual" } },
        { value: { individualGroupAndReviewState: "individual" } },
        { value: { individualReadyOnlyState: "individual" } },
        { value: { groupOnlyOneValueState: "group" } },
        { value: "viewResults" },
      ];

      const snapshotValueAction = [
        [
          createActivityTimeoutAction({
            activityId: Object.keys(snapshotValue.value)[0],
            force: true,
          }),
        ],
      ] as any[];
      const expectedActions = snapshotValueAction.concat(
        returnValues.slice(0, -1).map((rv) => [
          createActivityTimeoutAction({
            activityId: Object.keys(rv.value)[0],
            force: true,
          }),
        ])
      );

      sendStub.callsFake(() => returnValues.shift());
      clock.tick(minutesToMilliseconds(workshopDuration));

      const actualActions = sendStub.getCalls().map((a) => a.args);
      expect(actualActions).to.deep.equal(expectedActions);
      expect(workshopTimeoutCallbackSpy.callCount).to.equal(1);
      expect(workshopTimeoutCallbackSpy.getCall(0).args).to.deep.equal([
        {
          value: "viewResults",
        },
      ]);
      expect(activityPartTimeoutCallbackSpy.callCount).to.equal(0);
      expect(activityTimeoutCallbackSpy.callCount).to.equal(0);
      done();
    });

    it("should test activity timeout", (done) => {
      timeoutValues.activity.individualOnlyState.activityMinuteTimeout = 1;
      scheduler = new Scheduler(sessionMachineService as any, workshopDuration);

      const sendStub = stub(sessionMachineService, "send");
      const returnValues: any[] = [{ value: { groupOnlyState: "group" } }];

      const workshopTimeoutCallbackSpy = spy();
      scheduler.on("workshopTimeout", workshopTimeoutCallbackSpy);

      const activityPartTimeoutCallbackSpy = spy();
      scheduler.on("activityPartTimeout", activityPartTimeoutCallbackSpy);

      const activityTimeoutCallbackSpy = spy();
      scheduler.on("activityTimeout", activityTimeoutCallbackSpy);

      const expectedActions = [
        [
          createActivityTimeoutAction({
            activityId: "individualOnlyState",
          }),
        ],
      ];

      sendStub.callsFake(() => returnValues.shift());
      clock.tick(minutesToMilliseconds(1));

      const actualActions = sendStub.getCalls().map((a) => a.args);
      expect(actualActions).to.deep.equal(expectedActions);
      expect(workshopTimeoutCallbackSpy.callCount).to.equal(0);
      expect(activityPartTimeoutCallbackSpy.callCount).to.equal(0);
      expect(activityTimeoutCallbackSpy.callCount).to.equal(1);
      expect(activityTimeoutCallbackSpy.getCall(0).args).to.deep.equal([
        { value: { groupOnlyState: "group" } },
      ]);

      done();
      timeoutValues.activity.individualOnlyState.activityMinuteTimeout = 0;
    });

    it("should test activity part timeout", (done) => {
      timeoutValues.activity.individualOnlyState.individualMinuteTimeout = 1;
      scheduler = new Scheduler(sessionMachineService as any, workshopDuration);

      const sendStub = stub(sessionMachineService, "send");
      const returnValues: any[] = [{ value: { groupOnlyState: "group" } }];

      const workshopTimeoutCallbackSpy = spy();
      scheduler.on("workshopTimeout", workshopTimeoutCallbackSpy);

      const activityPartTimeoutCallbackSpy = spy();
      scheduler.on("activityPartTimeout", activityPartTimeoutCallbackSpy);

      const activityTimeoutCallbackSpy = spy();
      scheduler.on("activityTimeout", activityTimeoutCallbackSpy);

      const expectedActions = [
        [
          createActivityPartTimeoutAction({
            activityId: "individualOnlyState",
          }),
        ],
      ];

      sendStub.callsFake(() => returnValues.shift());
      clock.tick(minutesToMilliseconds(1));

      const actualActions = sendStub.getCalls().map((a) => a.args);
      expect(actualActions).to.deep.equal(expectedActions);
      expect(workshopTimeoutCallbackSpy.callCount).to.equal(0);
      expect(activityTimeoutCallbackSpy.callCount).to.equal(0);
      expect(activityPartTimeoutCallbackSpy.callCount).to.equal(1);
      expect(activityPartTimeoutCallbackSpy.getCall(0).args).to.deep.equal([
        { value: { groupOnlyState: "group" } },
      ]);
      done();
      timeoutValues.activity.individualOnlyState.individualMinuteTimeout = 0;
    });
  });
});
