import { expect } from "chai";
import {
  InMemorySessionMetadataState,
  createSessionReducerInitialState,
  getSessionReducer,
} from "./session";
import { InMemorySessionStage } from "../../../../../redis/types";
import {
  addGroupActivityEntry,
  addParticipant,
  endEmotionReady,
  finish,
  groupActivityReady,
  readyToStart,
  removeParticipant,
  setGroupActivityValue,
  setTeamName,
  startEmotionReady,
  teamNameReady,
} from "../actions";

describe("Apollo > Resources > In Memory Session Metadata", () => {
  const activityIds = ["1", "2", "3"];
  const profileIds = ["profile1", "profile2", "profile3"];
  const questionIds = ["question1", "question2", "question3"];
  const activityMap = activityIds.reduce(
    (acc, activityId) => ({
      ...acc,
      [activityId]: profileIds.map((profileId, index) => ({
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
      activityIds,
      participantProfileIds: profileIds,
    });
    dispatch = getSessionReducer(initialState);
  });

  describe("state creation", () => {
    it("should check initial value", (done) => {
      expect(initialState.participantProfileIds).to.deep.equal(profileIds);
      expect(initialState.currentActivityId).to.equal(activityIds[0]);
      expect(initialState.currentStage).to.equal(InMemorySessionStage.WAITING);
      expect(initialState.teamName).to.equal(null);
      expect(initialState.allActivitiesFinished).to.equal(false);
      expect(initialState.stages).to.equal(false);
      expect(initialState.activityMap).to.equal(false);

      done();
    });

    it("should createProfileReducerInitialState iterate over all stages before ongoing", (done) => {
      const stages1 = {
        [InMemorySessionStage.WAITING]: profileIds.slice(),
        [InMemorySessionStage.START_EMOTION_CHECK]: [],
        [InMemorySessionStage.TEAM_NAME]: [],
        [InMemorySessionStage.ON_GOING]: [],
        [InMemorySessionStage.END_EMOTION_CHECK]: [],
        [InMemorySessionStage.VIEW_RESULTS]: [],
      };
      const initialState1 = createSessionReducerInitialState({
        activityIds,
        participantProfileIds: profileIds,
        stages: stages1,
      });

      const stages2 = {
        ...stages1,
        [InMemorySessionStage.START_EMOTION_CHECK]: profileIds.slice(),
      };

      const initialState2 = createSessionReducerInitialState({
        activityIds,
        participantProfileIds: profileIds,
        stages: stages2,
      });

      const stages3 = {
        ...stages2,
        [InMemorySessionStage.TEAM_NAME]: profileIds.slice(),
      };

      const initialState3 = createSessionReducerInitialState({
        activityIds,
        participantProfileIds: profileIds,
        stages: stages3,
      });

      expect(initialState1.participantProfileIds).to.deep.equal(profileIds);
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

      expect(initialState2.participantProfileIds).to.deep.equal(profileIds);
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

      expect(initialState3.participantProfileIds).to.deep.equal(profileIds);
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
        "1": profileIds.map((profileId, index) => ({
          profileId,
          questionId: questionIds[index],
          ready: true,
        })),
        "2": profileIds.map((profileId, index) => ({
          profileId,
          questionId: questionIds[index],
          ready: true,
        })),
        "3": profileIds.map((profileId, index) => ({
          profileId,
          questionId: questionIds[index],
          ready: true,
        })),
      };
      const stages1 = {
        [InMemorySessionStage.WAITING]: profileIds.slice(),
        [InMemorySessionStage.START_EMOTION_CHECK]: profileIds.slice(),
        [InMemorySessionStage.TEAM_NAME]: profileIds.slice(),
        [InMemorySessionStage.ON_GOING]: [],
        [InMemorySessionStage.END_EMOTION_CHECK]: [],
        [InMemorySessionStage.VIEW_RESULTS]: [],
      };
      const initialState1 = createSessionReducerInitialState({
        activityIds,
        participantProfileIds: profileIds,
        stages: stages1,
        activityMap,
        teamName: "Hello",
      });

      const stages2 = {
        ...stages1,
      };

      const initialState2 = createSessionReducerInitialState({
        activityIds,
        participantProfileIds: profileIds,
        stages: stages2,
        activityMap,
        teamName: "Hello",
      });

      const stages3 = {
        ...stages2,
        [InMemorySessionStage.END_EMOTION_CHECK]: profileIds.slice(),
      };

      const initialState3 = createSessionReducerInitialState({
        activityIds,
        participantProfileIds: profileIds,
        stages: stages3,
        activityMap,
        teamName: "Hello",
      });

      expect(initialState1.participantProfileIds).to.deep.equal(profileIds);
      expect(initialState1.currentActivityId).to.equal(null);
      expect(initialState1.currentStage).to.equal(
        InMemorySessionStage.END_EMOTION_CHECK
      );
      expect(initialState1.teamName).to.equal("Hello");
      expect(initialState1.allActivitiesFinished).to.equal(true);
      expect(initialState1.stages).to.deep.equal(stages1);
      expect(initialState1.activityMap).to.deep.equal(activityMap);

      expect(initialState2.participantProfileIds).to.deep.equal(profileIds);
      expect(initialState2.currentActivityId).to.equal(null);
      expect(initialState2.currentStage).to.equal(
        InMemorySessionStage.END_EMOTION_CHECK
      );
      expect(initialState2.teamName).to.equal("Hello");
      expect(initialState2.allActivitiesFinished).to.equal(true);
      expect(initialState2.stages).to.deep.equal(stages2);
      expect(initialState2.activityMap).to.deep.equal(activityMap);

      expect(initialState3.participantProfileIds).to.deep.equal(profileIds);
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
  });

  describe("actions dispatch", () => {
    it("should add participant", (done) => {
      const action = addParticipant({ ids: ["4"] });
      const newState = dispatch(action);
      expect(newState.participantProfileIds).to.deep.equal(
        profileIds.concat("4")
      );
      done();
    });

    it("should remove participant", (done) => {
      const action = removeParticipant({ ids: profileIds[2] });
      const newState = dispatch(action);
      expect(newState.participantProfileIds).to.deep.equal(
        profileIds.slice(0, 2)
      );
      done();
    });

    it("should test readyToStart", (done) => {
      const action1 = readyToStart({ profileId: profileIds[2] });
      const newState1 = dispatch(action1);

      const action2 = readyToStart({ profileId: profileIds[0] });
      const newState2 = dispatch(action2, newState1);

      const action3 = readyToStart({ profileId: profileIds[1] });
      const newState3 = dispatch(action3, newState2);

      expect(newState1.stages[InMemorySessionStage.WAITING]).to.deep.equal(
        profileIds.slice(2)
      );
      expect(newState2.stages[InMemorySessionStage.WAITING]).to.deep.equal([
        profileIds[2],
        profileIds[0],
      ]);
      expect(newState3.stages[InMemorySessionStage.WAITING]).to.deep.equal([
        profileIds[2],
        profileIds[0],
        profileIds[1],
      ]);
      expect(newState3.currentStage).to.equal(
        InMemorySessionStage.START_EMOTION_CHECK
      );
      done();
    });

    it("should test setting team", (done) => {
      const newState1 = createSessionReducerInitialState({
        participantProfileIds: initialState.participantProfileIds,
        stages: {
          ...initialState.stages,
          [InMemorySessionStage.WAITING]: profileIds.slice(),
          [InMemorySessionStage.START_EMOTION_CHECK]: profileIds.slice(),
        },
        activityIds,
      });

      const action1 = setTeamName({ teamName: "Hello" });
      const newState2 = dispatch(action1, newState1);

      const action2 = setTeamName({ teamName: "Hello 2" });
      const newState3 = dispatch(action2, newState2);

      const action3 = teamNameReady({ profileId: profileIds[0] });
      const newState4 = dispatch(action3, newState3);

      const action4 = teamNameReady({ profileId: profileIds[1] });
      const newState5 = dispatch(action4, newState4);

      const action5 = teamNameReady({ profileId: profileIds[2] });
      const newState6 = dispatch(action5, newState5);

      expect(newState1.currentStage).to.equal(InMemorySessionStage.TEAM_NAME);
      expect(newState1.teamName).to.equal(null);

      expect(newState2.currentStage).to.equal(InMemorySessionStage.TEAM_NAME);
      expect(newState2.teamName).to.equal("Hello");

      expect(newState3.currentStage).to.equal(InMemorySessionStage.TEAM_NAME);
      expect(newState3.teamName).to.equal("Hello 2");

      expect(newState4.currentStage).to.equal(InMemorySessionStage.TEAM_NAME);
      expect(newState4.teamName).to.equal("Hello 2");
      expect(newState4.stages[InMemorySessionStage.TEAM_NAME]).to.deep.equal([
        profileIds[0],
      ]);

      expect(newState5.currentStage).to.equal(InMemorySessionStage.TEAM_NAME);
      expect(newState5.teamName).to.equal("Hello 2");
      expect(newState5.stages[InMemorySessionStage.TEAM_NAME]).to.deep.equal([
        profileIds[0],
        profileIds[1],
      ]);

      expect(newState6.currentStage).to.equal(InMemorySessionStage.ON_GOING);
      expect(newState6.teamName).to.equal("Hello 2");
      expect(newState6.stages[InMemorySessionStage.TEAM_NAME]).to.deep.equal([
        profileIds[0],
        profileIds[1],
        profileIds[2],
      ]);

      done();
    });

    it("should test start emotion ready", (done) => {
      const newState1 = createSessionReducerInitialState({
        participantProfileIds: initialState.participantProfileIds,
        stages: {
          ...initialState.stages,
          [InMemorySessionStage.WAITING]: profileIds.slice(),
        },
        activityIds,
      });

      const action1 = startEmotionReady({ profileId: profileIds[0] });
      const newState2 = dispatch(action1, newState1);

      const action2 = startEmotionReady({ profileId: profileIds[1] });
      const newState3 = dispatch(action2, newState2);

      const action3 = startEmotionReady({ profileId: profileIds[2] });
      const newState4 = dispatch(action3, newState3);

      expect(newState2.currentStage).to.equal(
        InMemorySessionStage.START_EMOTION_CHECK
      );
      expect(newState2.teamName).to.equal(null);
      expect(
        newState2.stages[InMemorySessionStage.START_EMOTION_CHECK]
      ).to.deep.equal([profileIds[0]]);

      expect(newState3.currentStage).to.equal(
        InMemorySessionStage.START_EMOTION_CHECK
      );
      expect(newState3.teamName).to.equal(null);
      expect(
        newState3.stages[InMemorySessionStage.START_EMOTION_CHECK]
      ).to.deep.equal([profileIds[0], profileIds[1]]);

      expect(newState4.currentStage).to.equal(InMemorySessionStage.TEAM_NAME);
      expect(newState4.teamName).to.equal(null);
      expect(
        newState4.stages[InMemorySessionStage.START_EMOTION_CHECK]
      ).to.deep.equal([profileIds[0], profileIds[1], profileIds[2]]);

      done();
    });

    it("should test end emotion ready", (done) => {
      const newState1 = createSessionReducerInitialState({
        participantProfileIds: initialState.participantProfileIds,
        stages: {
          ...initialState.stages,
          [InMemorySessionStage.WAITING]: profileIds.slice(),
          [InMemorySessionStage.START_EMOTION_CHECK]: profileIds.slice(),
          [InMemorySessionStage.TEAM_NAME]: profileIds.slice(),
          [InMemorySessionStage.ON_GOING]: profileIds.slice(),
        },
        activityIds,
        activityMap,
      });

      const action1 = endEmotionReady({ profileId: profileIds[0] });
      const newState2 = dispatch(action1, newState1);

      const action2 = endEmotionReady({ profileId: profileIds[1] });
      const newState3 = dispatch(action2, newState2);

      const action3 = endEmotionReady({ profileId: profileIds[2] });
      const newState4 = dispatch(action3, newState3);

      expect(newState2.currentStage).to.equal(
        InMemorySessionStage.END_EMOTION_CHECK
      );
      expect(newState2.teamName).to.equal(null);
      expect(
        newState2.stages[InMemorySessionStage.END_EMOTION_CHECK]
      ).to.deep.equal([profileIds[0]]);

      expect(newState3.currentStage).to.equal(
        InMemorySessionStage.END_EMOTION_CHECK
      );
      expect(newState3.teamName).to.equal(null);
      expect(
        newState3.stages[InMemorySessionStage.END_EMOTION_CHECK]
      ).to.deep.equal([profileIds[0], profileIds[1]]);

      expect(newState4.currentStage).to.equal(
        InMemorySessionStage.VIEW_RESULTS
      );
      expect(newState4.teamName).to.equal(null);
      expect(
        newState4.stages[InMemorySessionStage.END_EMOTION_CHECK]
      ).to.deep.equal([profileIds[0], profileIds[1], profileIds[2]]);

      done();
    });

    it("should finish", (done) => {
      const newState1 = createSessionReducerInitialState({
        participantProfileIds: initialState.participantProfileIds,
        stages: {
          ...initialState.stages,
          [InMemorySessionStage.WAITING]: profileIds.slice(),
          [InMemorySessionStage.START_EMOTION_CHECK]: profileIds.slice(),
          [InMemorySessionStage.TEAM_NAME]: profileIds.slice(),
          [InMemorySessionStage.ON_GOING]: profileIds.slice(),
          [InMemorySessionStage.END_EMOTION_CHECK]: profileIds.slice(),
        },
        activityIds,
        activityMap,
      });

      const action1 = finish();
      const newState2 = dispatch(action1, newState1);

      expect(newState2.currentStage).to.equal(
        InMemorySessionStage.VIEW_RESULTS
      );
      expect(newState2.teamName).to.equal(null);
      expect(
        newState2.stages[InMemorySessionStage.END_EMOTION_CHECK]
      ).to.deep.equal(profileIds);

      done();
    });

    it("set test group activity actions", (done) => {
      const newState1 = createSessionReducerInitialState({
        participantProfileIds: initialState.participantProfileIds,
        stages: {
          ...initialState.stages,
          [InMemorySessionStage.WAITING]: profileIds.slice(),
          [InMemorySessionStage.START_EMOTION_CHECK]: profileIds.slice(),
          [InMemorySessionStage.TEAM_NAME]: profileIds.slice(),
        },
        activityIds,
        teamName: "HELLO",
      });

      const action1 = setGroupActivityValue({
        questionId: questionIds[0],
        profileId: profileIds[1],
      });
      const newState2 = dispatch(action1, newState1);

      const action2 = setGroupActivityValue({
        questionId: questionIds[0],
        profileId: profileIds[2],
      });
      const newState3 = dispatch(action2, newState2);

      const action3 = setGroupActivityValue({
        questionId: questionIds[1],
        profileId: profileIds[0],
      });
      const newState4 = dispatch(action3, newState3);

      const action4 = groupActivityReady({
        profileId: profileIds[0],
      });
      const newState5 = dispatch(action4, newState4);
      const action5 = groupActivityReady({
        profileId: profileIds[1],
      });
      const newState6 = dispatch(action5, newState5);
      const action6 = groupActivityReady({
        profileId: profileIds[2],
      });
      const newState7 = dispatch(action6, newState6);

      expect(newState1.currentActivityId).to.equal(activityIds[0]);
      expect(newState2.currentStage).to.equal(InMemorySessionStage.ON_GOING);
      expect(newState2.teamName).to.equal("HELLO");
      expect(newState2.currentActivityId).to.equal(activityIds[0]);
      expect(newState2.activityMap[newState2.currentActivityId!]).to.deep.equal(
        [
          {
            questionId: questionIds[0],
            profileId: profileIds[1],
            ready: false,
          },
        ]
      );
      expect(newState3.currentActivityId).to.equal(activityIds[0]);
      expect(newState3.activityMap[newState2.currentActivityId!]).to.deep.equal(
        [
          {
            questionId: questionIds[0],
            profileId: profileIds[1],
            ready: false,
          },
          {
            questionId: questionIds[0],
            profileId: profileIds[2],
            ready: false,
          },
        ]
      );
      expect(newState4.currentActivityId).to.equal(activityIds[0]);
      expect(newState4.activityMap[newState2.currentActivityId!]).to.deep.equal(
        [
          {
            questionId: questionIds[0],
            profileId: profileIds[1],
            ready: false,
          },
          {
            questionId: questionIds[0],
            profileId: profileIds[2],
            ready: false,
          },
          {
            questionId: questionIds[1],
            profileId: profileIds[0],
            ready: false,
          },
        ]
      );

      expect(newState5.activityMap[newState2.currentActivityId!]).to.deep.equal(
        [
          {
            questionId: questionIds[0],
            profileId: profileIds[1],
            ready: false,
          },
          {
            questionId: questionIds[0],
            profileId: profileIds[2],
            ready: false,
          },
          {
            questionId: questionIds[1],
            profileId: profileIds[0],
            ready: true,
          },
        ]
      );

      expect(newState6.activityMap[newState2.currentActivityId!]).to.deep.equal(
        [
          {
            questionId: questionIds[0],
            profileId: profileIds[1],
            ready: true,
          },
          {
            questionId: questionIds[0],
            profileId: profileIds[2],
            ready: false,
          },
          {
            questionId: questionIds[1],
            profileId: profileIds[0],
            ready: true,
          },
        ]
      );

      expect(newState7.activityMap[newState2.currentActivityId!]).to.deep.equal(
        [
          {
            questionId: questionIds[0],
            profileId: profileIds[1],
            ready: true,
          },
          {
            questionId: questionIds[0],
            profileId: profileIds[2],
            ready: true,
          },
          {
            questionId: questionIds[1],
            profileId: profileIds[0],
            ready: true,
          },
        ]
      );

      expect(newState7.currentActivityId).to.equal(activityIds[1]);

      done();
    });

    it("set test group activity entry actions", (done) => {
      const newState1 = createSessionReducerInitialState({
        participantProfileIds: initialState.participantProfileIds,
        stages: {
          ...initialState.stages,
          [InMemorySessionStage.WAITING]: profileIds.slice(),
          [InMemorySessionStage.START_EMOTION_CHECK]: profileIds.slice(),
          [InMemorySessionStage.TEAM_NAME]: profileIds.slice(),
        },
        activityIds,
        teamName: "HELLO",
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

      const newState2 = dispatch(action1, newState1);
      const newState3 = dispatch(action2, newState2);
      const newState4 = dispatch(action3, newState3);

      expect(newState2.currentActivityId).to.equal(activityIds[0]);
      expect(newState2.activityMap[newState2.currentActivityId!]).to.deep.equal(
        [entry1]
      );

      expect(newState3.currentActivityId).to.equal(activityIds[0]);
      expect(newState3.activityMap[newState2.currentActivityId!]).to.deep.equal(
        [entry1, entry2]
      );

      expect(newState4.currentActivityId).to.equal(activityIds[0]);
      expect(newState4.activityMap[newState2.currentActivityId!]).to.deep.equal(
        [entry1, entry2, entry3]
      );

      done();
    });

    it("set test group activity entry actions and force update", (done) => {
      const newState1 = createSessionReducerInitialState({
        participantProfileIds: initialState.participantProfileIds,
        stages: {
          ...initialState.stages,
          [InMemorySessionStage.WAITING]: profileIds.slice(),
          [InMemorySessionStage.START_EMOTION_CHECK]: profileIds.slice(),
          [InMemorySessionStage.TEAM_NAME]: profileIds.slice(),
        },
        activityIds,
        teamName: "HELLO",
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
      const entry4 = {
        questionId: questionIds[1],
        profileId: profileIds[2],
        ready: true,
      };

      const action1 = addGroupActivityEntry({
        entry: entry1,
      });
      const action2 = addGroupActivityEntry({ entry: entry2 });
      const action3 = addGroupActivityEntry({ entry: entry3 });
      const action4 = addGroupActivityEntry({ entry: entry3 });
      const action5 = addGroupActivityEntry({ entry: entry4 });
      const action6 = addGroupActivityEntry({
        entry: entry4,
        forceUpdate: true,
      });

      const newState2 = dispatch(action1, newState1);
      const newState3 = dispatch(action2, newState2);
      const newState4 = dispatch(action3, newState3);
      const newState5 = dispatch(action4, newState4);
      const newState6 = dispatch(action5, newState5);
      const newState7 = dispatch(action6, newState6);

      expect(newState2.currentActivityId).to.equal(activityIds[0]);
      expect(newState2.activityMap[newState2.currentActivityId!]).to.deep.equal(
        [entry1]
      );

      expect(newState3.currentActivityId).to.equal(activityIds[0]);
      expect(newState3.activityMap[newState2.currentActivityId!]).to.deep.equal(
        [entry1, entry2]
      );

      expect(newState4.currentActivityId).to.equal(activityIds[0]);
      expect(newState4.activityMap[newState2.currentActivityId!]).to.deep.equal(
        [entry1, entry2, entry3]
      );

      expect(newState5.currentActivityId).to.equal(activityIds[0]);
      expect(newState5.activityMap[newState2.currentActivityId!]).to.deep.equal(
        [entry1, entry2, entry3]
      );

      expect(newState6.currentActivityId).to.equal(activityIds[0]);
      expect(newState6.activityMap[newState2.currentActivityId!]).to.deep.equal(
        [entry1, entry2, entry3]
      );

      expect(newState7.currentActivityId).to.equal(activityIds[0]);
      expect(newState7.activityMap[newState2.currentActivityId!]).to.deep.equal(
        [entry1, entry2, { ...entry4, ready: false }]
      );

      done();
    });
  });
});
