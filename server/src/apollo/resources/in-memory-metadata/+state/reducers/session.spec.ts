import { expect } from "chai";
import {
  InMemorySessionMetadataState,
  createSessionReducerInitialState,
  getSessionReducer,
} from "./session";
import {
  addGroupActivityEntry,
  addParticipant,
  endEmotionReady,
  finish,
  groupActivityReady,
  readyToStart,
  removeParticipant,
  setGroupActivityValue,
  setProfileActivityValue,
  setTeamName,
  startEmotionReady,
  teamNameReady,
} from "../actions";
import { InMemorySessionStage } from "../../../../../apollo/types";

describe("Apollo > Resources > In Memory Session Metadata", () => {
  const activityIds = ["1", "2", "3"];
  const profileIds = ["profile1", "profile2", "profile3"];
  const participantProfileIds = ["profile1", "profile2"];
  const connectedProfileIds = ["profile1"];
  const questionIds = ["question1", "question2", "question3"];
  const sessionId = "Session-123";
  const activityMap = activityIds.reduce(
    (acc, activityId) => ({
      ...acc,
      [activityId]: participantProfileIds.map((profileId, index) => ({
        profileId,
        questionId: questionIds[index],
        ready: true,
      })),
    }),
    {}
  );
  let initialState: InMemorySessionMetadataState;
  let dispatch: ReturnType<typeof getSessionReducer>;

  beforeEach(() => {
    initialState = createSessionReducerInitialState({
      sessionId,
      activityIds,
      participantProfileIds,
      profileIds,
      connectedProfileIds,
    });
    dispatch = getSessionReducer(initialState);
  });

  describe("state creation", () => {
    it("should check initial value", (done) => {
      expect(initialState.participantProfileIds).to.deep.equal(
        participantProfileIds
      );
      expect(initialState.currentActivityId).to.equal(activityIds[0]);
      expect(initialState.currentStage).to.equal(InMemorySessionStage.WAITING);
      expect(initialState.teamName).to.equal(null);
      expect(initialState.allActivitiesFinished).to.equal(false);
      expect(initialState.stages).to.deep.equal({
        [InMemorySessionStage.WAITING]: [],
        [InMemorySessionStage.START_EMOTION_CHECK]: [],
        [InMemorySessionStage.TEAM_NAME]: [],
        [InMemorySessionStage.ON_GOING]: [],
        [InMemorySessionStage.END_EMOTION_CHECK]: [],
        [InMemorySessionStage.VIEW_RESULTS]: [],
      });
      expect(initialState.activityMap).to.deep.equal(
        activityIds.reduce(
          (acc, activityId) => ({ ...acc, [activityId]: [] }),
          {}
        )
      );

      done();
    });

    it("should createProfileReducerInitialState iterate over all stages before ongoing", (done) => {
      const stages1 = {
        [InMemorySessionStage.WAITING]: participantProfileIds.slice(),
        [InMemorySessionStage.START_EMOTION_CHECK]: [],
        [InMemorySessionStage.TEAM_NAME]: [],
        [InMemorySessionStage.ON_GOING]: [],
        [InMemorySessionStage.END_EMOTION_CHECK]: [],
        [InMemorySessionStage.VIEW_RESULTS]: [],
      };
      const initialState1 = createSessionReducerInitialState({
        activityIds,
        participantProfileIds,
        stages: stages1,
        sessionId,
        profileIds,
        connectedProfileIds,
      });

      const stages2 = {
        ...stages1,
        [InMemorySessionStage.START_EMOTION_CHECK]:
          participantProfileIds.slice(),
      };

      const initialState2 = createSessionReducerInitialState({
        activityIds,
        participantProfileIds,
        stages: stages2,
        sessionId,
        profileIds,
        connectedProfileIds,
      });

      const stages3 = {
        ...stages2,
        [InMemorySessionStage.TEAM_NAME]: participantProfileIds.slice(),
      };

      const initialState3 = createSessionReducerInitialState({
        activityIds,
        participantProfileIds,
        stages: stages3,
        sessionId,
        profileIds,
        connectedProfileIds,
      });

      expect(initialState1.participantProfileIds).to.deep.equal(
        participantProfileIds
      );
      expect(initialState1.currentActivityId).to.equal(activityIds[0]);
      expect(initialState1.currentStage).to.equal(
        InMemorySessionStage.START_EMOTION_CHECK
      );
      expect(initialState1.teamName).to.equal(null);
      expect(initialState1.allActivitiesFinished).to.equal(false);
      expect(initialState1.stages).to.deep.equal(stages1);
      expect(initialState1.activityMap).to.deep.equal({
        "1": [],
        "2": [],
        "3": [],
      });

      expect(initialState2.participantProfileIds).to.deep.equal(
        participantProfileIds
      );
      expect(initialState2.currentActivityId).to.equal(activityIds[0]);
      expect(initialState2.currentStage).to.equal(
        InMemorySessionStage.TEAM_NAME
      );
      expect(initialState2.teamName).to.equal(null);
      expect(initialState2.allActivitiesFinished).to.equal(false);
      expect(initialState2.stages).to.deep.equal(stages2);
      expect(initialState2.activityMap).to.deep.equal({
        "1": [],
        "2": [],
        "3": [],
      });

      expect(initialState3.participantProfileIds).to.deep.equal(
        participantProfileIds
      );
      expect(initialState3.currentActivityId).to.equal(activityIds[0]);
      expect(initialState3.currentStage).to.equal(
        InMemorySessionStage.ON_GOING
      );
      expect(initialState3.teamName).to.equal(null);
      expect(initialState3.allActivitiesFinished).to.equal(false);
      expect(initialState3.stages).to.deep.equal(stages3);
      expect(initialState3.activityMap).to.deep.equal({
        "1": [],
        "2": [],
        "3": [],
      });

      done();
    });

    it("should createProfileReducerInitialState iterate over all stages after ongoing", (done) => {
      const activityMap = {
        "1": participantProfileIds.map((profileId, index) => ({
          profileId,
          questionId: questionIds[index],
          ready: true,
        })),
        "2": participantProfileIds.map((profileId, index) => ({
          profileId,
          questionId: questionIds[index],
          ready: true,
        })),
        "3": participantProfileIds.map((profileId, index) => ({
          profileId,
          questionId: questionIds[index],
          ready: true,
        })),
      };
      const stages1 = {
        [InMemorySessionStage.WAITING]: participantProfileIds.slice(),
        [InMemorySessionStage.START_EMOTION_CHECK]:
          participantProfileIds.slice(),
        [InMemorySessionStage.TEAM_NAME]: participantProfileIds.slice(),
        [InMemorySessionStage.ON_GOING]: [],
        [InMemorySessionStage.END_EMOTION_CHECK]: [],
        [InMemorySessionStage.VIEW_RESULTS]: [],
      };
      const initialState1 = createSessionReducerInitialState({
        activityIds,
        participantProfileIds,
        stages: stages1,
        activityMap,
        teamName: "Hello",
        sessionId,
        profileIds,
        connectedProfileIds,
      });

      const stages2 = {
        ...stages1,
      };

      const initialState2 = createSessionReducerInitialState({
        activityIds,
        participantProfileIds,
        stages: stages2,
        activityMap,
        teamName: "Hello",
        sessionId,
        profileIds,
        connectedProfileIds,
      });

      const stages3 = {
        ...stages2,
        [InMemorySessionStage.END_EMOTION_CHECK]: participantProfileIds.slice(),
      };

      const initialState3 = createSessionReducerInitialState({
        activityIds,
        participantProfileIds,
        stages: stages3,
        activityMap,
        teamName: "Hello",
        sessionId,
        profileIds,
        connectedProfileIds,
      });

      expect(initialState1.participantProfileIds).to.deep.equal(
        participantProfileIds
      );
      expect(initialState1.currentActivityId).to.equal(null);
      expect(initialState1.currentStage).to.equal(
        InMemorySessionStage.END_EMOTION_CHECK
      );
      expect(initialState1.teamName).to.equal("Hello");
      expect(initialState1.allActivitiesFinished).to.equal(true);
      expect(initialState1.stages).to.deep.equal(stages1);
      expect(initialState1.activityMap).to.deep.equal(activityMap);

      expect(initialState2.participantProfileIds).to.deep.equal(
        participantProfileIds
      );
      expect(initialState2.currentActivityId).to.equal(null);
      expect(initialState2.currentStage).to.equal(
        InMemorySessionStage.END_EMOTION_CHECK
      );
      expect(initialState2.teamName).to.equal("Hello");
      expect(initialState2.allActivitiesFinished).to.equal(true);
      expect(initialState2.stages).to.deep.equal(stages2);
      expect(initialState2.activityMap).to.deep.equal(activityMap);

      expect(initialState3.participantProfileIds).to.deep.equal(
        participantProfileIds
      );
      expect(initialState3.currentActivityId).to.equal(null);
      expect(initialState3.currentStage).to.equal(
        InMemorySessionStage.VIEW_RESULTS
      );
      expect(initialState3.teamName).to.equal("Hello");
      expect(initialState3.allActivitiesFinished).to.equal(true);
      expect(initialState3.stages).to.deep.equal(stages3);
      expect(initialState3.activityMap).to.deep.equal(activityMap);

      done();
    });

    it("should have result hasChanges equal to false", (done) => {
      const action = setProfileActivityValue({
        profileId: participantProfileIds[0],
        questionId: questionIds[0],
      });
      const result = dispatch(action);
      expect(result.hasStateChanged).to.equal(false);
      expect(result.state).to.deep.equal(initialState);
      done();
    });
  });

  describe("actions dispatch", () => {
    it("should add participant", (done) => {
      const action = addParticipant({ ids: ["4"] });
      const result = dispatch(action);
      expect(result.state.participantProfileIds).to.deep.equal(
        participantProfileIds.concat("4")
      );
      expect(result.hasStateChanged).to.equal(true);
      done();
    });

    it("should remove participant", (done) => {
      const action = removeParticipant({ ids: participantProfileIds[1] });
      const result = dispatch(action);
      expect(result.state.participantProfileIds).to.deep.equal([
        participantProfileIds[0],
      ]);
      expect(result.hasStateChanged).to.equal(true);
      done();
    });

    it("should test readyToStart", (done) => {
      const action1 = readyToStart({ profileId: participantProfileIds[0] });
      const result2 = dispatch(action1, initialState);

      const action3 = readyToStart({ profileId: participantProfileIds[1] });
      const result3 = dispatch(action3, result2.state);

      expect(result2.state.stages[InMemorySessionStage.WAITING]).to.deep.equal([
        participantProfileIds[0],
      ]);
      expect(result3.state.stages[InMemorySessionStage.WAITING]).to.deep.equal([
        participantProfileIds[0],
        participantProfileIds[1],
      ]);
      expect(result3.state.currentStage).to.equal(
        InMemorySessionStage.START_EMOTION_CHECK
      );
      expect(result2.hasStateChanged).to.equal(true);
      expect(result3.hasStateChanged).to.equal(true);
      done();
    });

    it("should test setting team", (done) => {
      const state = createSessionReducerInitialState({
        participantProfileIds: initialState.participantProfileIds,
        stages: {
          ...initialState.stages,
          [InMemorySessionStage.WAITING]:
            initialState.participantProfileIds.slice(),
          [InMemorySessionStage.START_EMOTION_CHECK]:
            initialState.participantProfileIds.slice(),
        },
        activityIds,
        sessionId,
        profileIds,
        connectedProfileIds,
      });

      const action1 = setTeamName({ teamName: "Hello" });
      const result2 = dispatch(action1, state);

      const action2 = setTeamName({ teamName: "Hello 2" });
      const result3 = dispatch(action2, result2.state);

      const action3 = teamNameReady({ profileId: participantProfileIds[0] });
      const result4 = dispatch(action3, result3.state);

      const action4 = teamNameReady({ profileId: participantProfileIds[1] });
      const result5 = dispatch(action4, result4.state);

      expect(state.currentStage).to.equal(InMemorySessionStage.TEAM_NAME);
      expect(state.teamName).to.equal(null);
      expect(result2.hasStateChanged).to.equal(true);
      expect(result2.state.currentStage).to.equal(
        InMemorySessionStage.TEAM_NAME
      );
      expect(result2.state.teamName).to.equal("Hello");

      expect(result3.state.currentStage).to.equal(
        InMemorySessionStage.TEAM_NAME
      );
      expect(result3.state.teamName).to.equal("Hello 2");
      expect(result3.hasStateChanged).to.equal(true);

      expect(result4.state.currentStage).to.equal(
        InMemorySessionStage.TEAM_NAME
      );
      expect(result4.state.teamName).to.equal("Hello 2");
      expect(
        result4.state.stages[InMemorySessionStage.TEAM_NAME]
      ).to.deep.equal([profileIds[0]]);
      expect(result4.hasStateChanged).to.equal(true);

      expect(result5.state.currentStage).to.equal(
        InMemorySessionStage.ON_GOING
      );
      expect(result5.state.teamName).to.equal("Hello 2");
      expect(
        result5.state.stages[InMemorySessionStage.TEAM_NAME]
      ).to.deep.equal([participantProfileIds[0], participantProfileIds[1]]);
      expect(result5.hasStateChanged).to.equal(true);

      done();
    });

    it("should test start emotion ready", (done) => {
      const newState1 = createSessionReducerInitialState({
        participantProfileIds: initialState.participantProfileIds,
        stages: {
          ...initialState.stages,
          [InMemorySessionStage.WAITING]:
            initialState.participantProfileIds.slice(),
        },
        activityIds,
        sessionId,
        profileIds,
        connectedProfileIds,
      });

      const action1 = startEmotionReady({
        profileId: participantProfileIds[0],
      });
      const result2 = dispatch(action1, newState1);

      const action2 = startEmotionReady({
        profileId: participantProfileIds[1],
      });
      const result3 = dispatch(action2, result2.state);

      expect(result2.state.currentStage).to.equal(
        InMemorySessionStage.START_EMOTION_CHECK
      );
      expect(result2.hasStateChanged).to.equal(true);
      expect(result2.state.teamName).to.equal(null);
      expect(
        result2.state.stages[InMemorySessionStage.START_EMOTION_CHECK]
      ).to.deep.equal([participantProfileIds[0]]);

      expect(result3.state.currentStage).to.equal(
        InMemorySessionStage.TEAM_NAME
      );
      expect(result3.hasStateChanged).to.equal(true);
      expect(result3.state.teamName).to.equal(null);
      expect(
        result3.state.stages[InMemorySessionStage.START_EMOTION_CHECK]
      ).to.deep.equal([participantProfileIds[0], participantProfileIds[1]]);

      done();
    });

    it("should test end emotion ready", (done) => {
      const newState1 = createSessionReducerInitialState({
        participantProfileIds: initialState.participantProfileIds,
        stages: {
          ...initialState.stages,
          [InMemorySessionStage.WAITING]:
            initialState.participantProfileIds.slice(),
          [InMemorySessionStage.START_EMOTION_CHECK]:
            initialState.participantProfileIds.slice(),
          [InMemorySessionStage.TEAM_NAME]:
            initialState.participantProfileIds.slice(),
          [InMemorySessionStage.ON_GOING]:
            initialState.participantProfileIds.slice(),
        },
        activityIds,
        activityMap,
        sessionId,
        profileIds,
        connectedProfileIds,
      });

      const action1 = endEmotionReady({ profileId: participantProfileIds[0] });
      const result2 = dispatch(action1, newState1);

      const action2 = endEmotionReady({ profileId: participantProfileIds[1] });
      const result3 = dispatch(action2, result2.state);

      expect(result2.state.currentStage).to.equal(
        InMemorySessionStage.END_EMOTION_CHECK
      );
      expect(result2.state.teamName).to.equal(null);
      expect(
        result2.state.stages[InMemorySessionStage.END_EMOTION_CHECK]
      ).to.deep.equal([participantProfileIds[0]]);
      expect(result2.hasStateChanged).to.equal(true);

      expect(result3.state.currentStage).to.equal(
        InMemorySessionStage.VIEW_RESULTS
      );
      expect(result3.state.teamName).to.equal(null);
      expect(
        result3.state.stages[InMemorySessionStage.END_EMOTION_CHECK]
      ).to.deep.equal([participantProfileIds[0], participantProfileIds[1]]);
      expect(result3.hasStateChanged).to.equal(true);

      done();
    });

    it("should finish", (done) => {
      const newState1 = createSessionReducerInitialState({
        participantProfileIds: initialState.participantProfileIds,
        stages: {
          ...initialState.stages,
          [InMemorySessionStage.WAITING]:
            initialState.participantProfileIds.slice(),
          [InMemorySessionStage.START_EMOTION_CHECK]:
            initialState.participantProfileIds.slice(),
          [InMemorySessionStage.TEAM_NAME]:
            initialState.participantProfileIds.slice(),
          [InMemorySessionStage.ON_GOING]:
            initialState.participantProfileIds.slice(),
          [InMemorySessionStage.END_EMOTION_CHECK]:
            initialState.participantProfileIds.slice(),
        },
        activityIds,
        activityMap,
        sessionId,
        profileIds,
        connectedProfileIds,
      });

      const action1 = finish();
      const result2 = dispatch(action1, newState1);

      expect(result2.state.currentStage).to.equal(
        InMemorySessionStage.VIEW_RESULTS
      );
      expect(result2.state.teamName).to.equal(null);
      expect(
        result2.state.stages[InMemorySessionStage.END_EMOTION_CHECK]
      ).to.deep.equal(initialState.participantProfileIds);
      expect(result2.hasStateChanged).to.equal(true);

      done();
    });

    it("set test group activity actions", (done) => {
      const newState1 = createSessionReducerInitialState({
        participantProfileIds: initialState.participantProfileIds,
        stages: {
          ...initialState.stages,
          [InMemorySessionStage.WAITING]:
            initialState.participantProfileIds.slice(),
          [InMemorySessionStage.START_EMOTION_CHECK]:
            initialState.participantProfileIds.slice(),
          [InMemorySessionStage.TEAM_NAME]:
            initialState.participantProfileIds.slice(),
        },
        activityIds,
        teamName: "HELLO",
        sessionId,
        profileIds,
        connectedProfileIds,
      });

      const action1 = setGroupActivityValue({
        questionId: questionIds[0],
        profileId: participantProfileIds[1],
      });
      const result2 = dispatch(action1, newState1);

      const action2 = setGroupActivityValue({
        questionId: questionIds[1],
        profileId: participantProfileIds[0],
      });
      const result3 = dispatch(action2, result2.state);

      const action4 = groupActivityReady({
        profileId: participantProfileIds[0],
      });
      const result4 = dispatch(action4, result3.state);
      const action5 = groupActivityReady({
        profileId: participantProfileIds[1],
      });
      const result6 = dispatch(action5, result4.state);

      expect(newState1.currentActivityId).to.equal(activityIds[0]);
      expect(result2.state.currentStage).to.equal(
        InMemorySessionStage.ON_GOING
      );
      expect(result2.state.teamName).to.equal("HELLO");
      expect(result2.state.currentActivityId).to.equal(activityIds[0]);
      expect(
        result2.state.activityMap[result2.state.currentActivityId!]
      ).to.deep.equal([
        {
          questionId: questionIds[0],
          profileId: participantProfileIds[1],
          ready: false,
        },
      ]);
      expect(result2.hasStateChanged).to.equal(true);
      expect(result3.state.currentActivityId).to.equal(activityIds[0]);
      expect(
        result3.state.activityMap[result2.state.currentActivityId!]
      ).to.deep.equal([
        {
          questionId: questionIds[0],
          profileId: participantProfileIds[1],
          ready: false,
        },
        {
          questionId: questionIds[1],
          profileId: participantProfileIds[0],
          ready: false,
        },
      ]);
      expect(result3.hasStateChanged).to.equal(true);

      expect(
        result4.state.activityMap[result2.state.currentActivityId!]
      ).to.deep.equal([
        {
          questionId: questionIds[0],
          profileId: participantProfileIds[1],
          ready: false,
        },
        {
          questionId: questionIds[1],
          profileId: participantProfileIds[0],
          ready: true,
        },
      ]);
      expect(result4.hasStateChanged).to.equal(true);

      expect(
        result6.state.activityMap[result2.state.currentActivityId!]
      ).to.deep.equal([
        {
          questionId: questionIds[0],
          profileId: participantProfileIds[1],
          ready: true,
        },
        {
          questionId: questionIds[1],
          profileId: participantProfileIds[0],
          ready: true,
        },
      ]);
      expect(result6.hasStateChanged).to.equal(true);

      expect(result6.state.currentActivityId).to.equal(activityIds[1]);

      done();
    });

    it("set test group activity entry actions", (done) => {
      const newState1 = createSessionReducerInitialState({
        participantProfileIds: initialState.participantProfileIds,
        stages: {
          ...initialState.stages,
          [InMemorySessionStage.WAITING]:
            initialState.participantProfileIds.slice(),
          [InMemorySessionStage.START_EMOTION_CHECK]:
            initialState.participantProfileIds.slice(),
          [InMemorySessionStage.TEAM_NAME]:
            initialState.participantProfileIds.slice(),
        },
        activityIds,
        teamName: "HELLO",
        sessionId,
        profileIds,
        connectedProfileIds,
      });
      const entry1 = {
        questionId: questionIds[0],
        profileId: profileIds[0],
        ready: false,
      };
      const entry2 = {
        questionId: questionIds[0],
        profileId: profileIds[1],
        ready: false,
      };
      const entry3 = {
        questionId: questionIds[0],
        profileId: profileIds[2],
        ready: false,
      };

      const action1 = addGroupActivityEntry({
        entry: entry1,
      });
      const action2 = addGroupActivityEntry({ entry: entry2 });
      const action3 = addGroupActivityEntry({ entry: entry3 });

      const result2 = dispatch(action1, newState1);
      const result3 = dispatch(action2, result2.state);
      const result4 = dispatch(action3, result3.state);

      expect(result2.state.currentActivityId).to.equal(activityIds[0]);
      expect(
        result2.state.activityMap[result2.state.currentActivityId!]
      ).to.deep.equal([entry1]);
      expect(result3.hasStateChanged).to.equal(true);

      expect(result3.state.currentActivityId).to.equal(activityIds[0]);
      expect(
        result3.state.activityMap[result2.state.currentActivityId!]
      ).to.deep.equal([entry1, entry2]);
      expect(result3.hasStateChanged).to.equal(true);

      expect(result4.state.currentActivityId).to.equal(activityIds[0]);
      expect(
        result4.state.activityMap[result2.state.currentActivityId!]
      ).to.deep.equal([entry1, entry2, entry3]);
      expect(result4.hasStateChanged).to.equal(true);

      done();
    });

    it("set test group activity entry actions and force update", (done) => {
      const newState1 = createSessionReducerInitialState({
        participantProfileIds: initialState.participantProfileIds,
        stages: {
          ...initialState.stages,
          [InMemorySessionStage.WAITING]:
            initialState.participantProfileIds.slice(),
          [InMemorySessionStage.START_EMOTION_CHECK]:
            initialState.participantProfileIds.slice(),
          [InMemorySessionStage.TEAM_NAME]:
            initialState.participantProfileIds.slice(),
        },
        activityIds,
        teamName: "HELLO",
        sessionId,
        profileIds,
        connectedProfileIds,
      });
      const entry1 = {
        questionId: questionIds[0],
        profileId: participantProfileIds[0],
        ready: false,
      };
      const entry2 = {
        questionId: questionIds[0],
        profileId: participantProfileIds[1],
        ready: false,
      };
      const entry4 = {
        questionId: questionIds[1],
        profileId: participantProfileIds[1],
        ready: true,
      };

      const action1 = addGroupActivityEntry({
        entry: entry1,
      });
      const action2 = addGroupActivityEntry({ entry: entry2 });
      const action3 = addGroupActivityEntry({ entry: entry2 });
      const action5 = addGroupActivityEntry({ entry: entry4 });
      const action6 = addGroupActivityEntry({
        entry: entry4,
        forceUpdate: true,
      });

      const result2 = dispatch(action1, newState1);
      const result3 = dispatch(action2, result2.state);
      const result4 = dispatch(action3, result3.state);
      const result6 = dispatch(action5, result4.state);
      const result7 = dispatch(action6, result6.state);

      expect(result2.hasStateChanged).to.equal(true);
      expect(result2.state.currentActivityId).to.equal(activityIds[0]);
      expect(
        result2.state.activityMap[result2.state.currentActivityId!]
      ).to.deep.equal([entry1]);

      expect(result3.hasStateChanged).to.equal(true);
      expect(result3.state.currentActivityId).to.equal(activityIds[0]);
      expect(
        result3.state.activityMap[result2.state.currentActivityId!]
      ).to.deep.equal([entry1, entry2]);

      expect(result4.hasStateChanged).to.equal(false);
      expect(result4.state.currentActivityId).to.equal(activityIds[0]);
      expect(
        result4.state.activityMap[result2.state.currentActivityId!]
      ).to.deep.equal([entry1, entry2]);

      expect(result6.hasStateChanged).to.equal(false);
      expect(result6.state.currentActivityId).to.equal(activityIds[0]);
      expect(
        result6.state.activityMap[result2.state.currentActivityId!]
      ).to.deep.equal([entry1, entry2]);

      expect(result7.hasStateChanged).to.equal(true);
      expect(result7.state.currentActivityId).to.equal(activityIds[0]);
      expect(
        result7.state.activityMap[result2.state.currentActivityId!]
      ).to.deep.equal([entry1, { ...entry4, ready: false }]);

      done();
    });
  });
});
