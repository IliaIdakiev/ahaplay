import { expect } from "chai";
import {
  InMemoryProfileMetadataState,
  createProfileReducerInitialState,
  getProfileReducer,
} from "./profile";
import {
  profileActivityReady,
  setActivityMode,
  setProfileActivityValue,
} from "../actions";
import { getUnixTime } from "date-fns";
import { ActivityMode, InMemorySessionStage } from "../types";

describe("Apollo > Resources > In Memory Profile Metadata", () => {
  const activityIds = ["1", "2", "3"];
  const participantProfileIds = ["profile1", "profile2", "profile3"];
  const questionIds = ["question1", "question2", "question3"];
  const sessionId = "Session-123";
  const startEmotions = participantProfileIds.map((profileId) => ({
    profileId,
    emotion: 1,
  }));
  const endEmotions = participantProfileIds.map((profileId) => ({
    profileId,
    emotion: 4,
  }));
  let initialState: InMemoryProfileMetadataState;
  let dispatch: ReturnType<typeof getProfileReducer>;
  let initialTimestamp: number;

  beforeEach(() => {
    initialState = createProfileReducerInitialState({
      activityIds,
      participantProfileIds,
      sessionId,
      sessionStage: InMemorySessionStage.ON_GOING,
    });
    initialTimestamp = getUnixTime(new Date());
    dispatch = getProfileReducer(initialState);
  });

  describe("state creation", () => {
    it("should createProfileReducerInitialState initial", (done) => {
      expect(initialState.activityIds).to.deep.equal(activityIds);
      expect(initialState.currentProfileActivityId).to.equal(activityIds[0]);
      expect(initialState.activityMap).to.deep.equal({
        "1": participantProfileIds.map((profileId) => ({
          profileId,
          value: null,
          ready: false,
        })),
        "2": participantProfileIds.map((profileId) => ({
          profileId,
          value: null,
          ready: false,
        })),
        "3": participantProfileIds.map((profileId) => ({
          profileId,
          value: null,
          ready: false,
        })),
      });
      expect(initialState.finished).to.deep.equal(false);
      expect(initialState.lastUpdateTimestamp).to.equal(initialTimestamp);
      expect(initialState.startEmotions).to.deep.equal([]);
      expect(initialState.endEmotions).to.deep.equal([]);
      done();
    });

    it("should createProfileReducerInitialState all activities ready", (done) => {
      const activityMap = activityIds.reduce(
        (acc, activityId) => ({
          ...acc,
          [activityId]: participantProfileIds.map((profileId, index) => ({
            profileId,
            value: questionIds[index],
            ready: true,
          })),
        }),
        {}
      );
      const timestamp = getUnixTime(new Date());

      initialState = createProfileReducerInitialState({
        activityIds,
        participantProfileIds,
        activityMap,
        lastUpdateTimestamp: timestamp,
        startEmotions,
        endEmotions,
        sessionId,
        sessionStage: InMemorySessionStage.ON_GOING,
      });

      expect(initialState.activityIds).to.deep.equal(activityIds);
      expect(initialState.currentProfileActivityId).to.equal(activityIds[2]);
      expect(initialState.activityMap).to.deep.equal({
        "1": participantProfileIds.map((profileId, index) => ({
          profileId,
          value: questionIds[index],
          ready: true,
        })),
        "2": participantProfileIds.map((profileId, index) => ({
          profileId,
          value: questionIds[index],
          ready: true,
        })),
        "3": participantProfileIds.map((profileId, index) => ({
          profileId,
          value: questionIds[index],
          ready: true,
        })),
      });
      expect(initialState.finished).to.deep.equal(true);
      expect(initialState.lastUpdateTimestamp).to.equal(timestamp);
      expect(initialState.startEmotions).to.deep.equal(startEmotions);
      expect(initialState.endEmotions).to.deep.equal(endEmotions);
      done();
    });

    it("should createProfileReducerInitialState two activities ready", (done) => {
      const activityMap = activityIds.reduce(
        (acc, activityId, index) => ({
          ...acc,
          [activityId]: participantProfileIds.map((profileId, pIndex) => ({
            profileId,
            value: index < 2 ? questionIds[pIndex] : null,
            ready: index < 2,
          })),
        }),
        {}
      );
      const timestamp = getUnixTime(new Date());
      initialState = createProfileReducerInitialState({
        activityIds,
        participantProfileIds,
        activityMap,
        lastUpdateTimestamp: timestamp,
        startEmotions,
        endEmotions,
        sessionId,
        sessionStage: InMemorySessionStage.ON_GOING,
      });

      expect(initialState.activityIds).to.deep.equal(activityIds);
      expect(initialState.currentProfileActivityId).to.equal(activityIds[2]);
      expect(initialState.activityMap).to.deep.equal({
        "1": participantProfileIds.map((profileId, index) => ({
          profileId,
          value: questionIds[index],
          ready: true,
        })),
        "2": participantProfileIds.map((profileId, index) => ({
          profileId,
          value: questionIds[index],
          ready: true,
        })),
        "3": participantProfileIds.map((profileId) => ({
          profileId,
          value: null,
          ready: false,
        })),
      });
      expect(initialState.finished).to.deep.equal(false);
      expect(initialState.lastUpdateTimestamp).to.equal(timestamp);
      expect(initialState.startEmotions).to.deep.equal(startEmotions);
      expect(initialState.endEmotions).to.deep.equal(endEmotions);
      done();
    });

    it("should createProfileReducerInitialState one and half activities ready", (done) => {
      const activityMap = activityIds.reduce(
        (acc, activityId, index) => ({
          ...acc,
          [activityId]: participantProfileIds.map((profileId, pIndex) => ({
            profileId,
            value:
              index < 1 || (index < 2 && pIndex < 2)
                ? questionIds[pIndex]
                : null,
            ready: index < 1 || (index < 2 && pIndex < 2),
          })),
        }),
        {}
      );

      const timestamp = getUnixTime(new Date());
      initialState = createProfileReducerInitialState({
        activityIds,
        participantProfileIds,
        activityMap,
        lastUpdateTimestamp: timestamp,
        startEmotions,
        endEmotions,
        sessionId,
        sessionStage: InMemorySessionStage.ON_GOING,
      });

      expect(initialState.activityIds).to.deep.equal(activityIds);
      expect(initialState.currentProfileActivityId).to.equal(activityIds[1]);
      expect(initialState.activityMap).to.deep.equal({
        "1": participantProfileIds.map((profileId, index) => ({
          profileId,
          value: questionIds[index],
          ready: true,
        })),
        "2": participantProfileIds.map((profileId, index) => ({
          profileId,
          value: index < 2 ? questionIds[index] : null,
          ready: index < 2,
        })),
        "3": participantProfileIds.map((profileId) => ({
          profileId,
          value: null,
          ready: false,
        })),
      });
      expect(initialState.finished).to.deep.equal(false);
      expect(initialState.lastUpdateTimestamp).to.equal(timestamp);
      expect(initialState.startEmotions).to.deep.equal(startEmotions);
      expect(initialState.endEmotions).to.deep.equal(endEmotions);
      done();
    });
  });

  describe("actions dispatch", () => {
    it("should setProfileActivityValue for currentActivity for a given player", (done) => {
      const currentActivityId = initialState.currentProfileActivityId;
      const timestamp = getUnixTime(new Date());
      const action = setProfileActivityValue({
        value: questionIds[2],
        profileId: participantProfileIds[1],
        activityId: activityIds[0],
      });
      const result = dispatch(action);
      expect(
        result.state.activityMap[currentActivityId!].find(
          (a) => a.profileId === participantProfileIds[1]
        )
      ).to.deep.equal({
        value: questionIds[2],
        profileId: participantProfileIds[1],
        ready: false,
      });
      expect(result.state.lastUpdateTimestamp).to.equal(timestamp);
      done();
    });

    it("should setProfileActivityValue for currentActivity for all players", (done) => {
      const timestamp = getUnixTime(new Date());
      const action1 = setProfileActivityValue({
        value: questionIds[2],
        profileId: participantProfileIds[0],
        activityId: activityIds[0],
      });
      const action2 = setProfileActivityValue({
        value: questionIds[0],
        profileId: participantProfileIds[1],
        activityId: activityIds[0],
      });
      const action3 = setProfileActivityValue({
        value: questionIds[1],
        profileId: participantProfileIds[2],
        activityId: activityIds[0],
      });

      const result1 = dispatch(action1);
      const result2 = dispatch(action2, result1.state);
      const result3 = dispatch(action3, result2.state);

      expect(result3.state.lastUpdateTimestamp).to.equal(timestamp);
      expect(result3.state.activityMap).to.deep.equal({
        "1": participantProfileIds.map((profileId, index) => ({
          profileId,
          value:
            index === 0
              ? questionIds[2]
              : index === 1
              ? questionIds[0]
              : questionIds[1],
          ready: false,
        })),
        "2": participantProfileIds.map((profileId) => ({
          profileId,
          value: null,
          ready: false,
        })),
        "3": participantProfileIds.map((profileId) => ({
          profileId,
          value: null,
          ready: false,
        })),
      });
      done();
    });

    it("should not set activity to ready because there is no value", (done) => {
      const action1 = setProfileActivityValue({
        value: questionIds[2],
        profileId: participantProfileIds[0],
        activityId: activityIds[0],
      });
      const action2 = profileActivityReady({
        profileId: participantProfileIds[1],
        activityId: activityIds[0],
      });
      const action3 = setProfileActivityValue({
        value: questionIds[1],
        profileId: participantProfileIds[2],
        activityId: activityIds[0],
      });

      const action4 = profileActivityReady({
        profileId: participantProfileIds[1],
        activityId: activityIds[0],
      });
      const action5 = profileActivityReady({
        profileId: participantProfileIds[2],
        activityId: activityIds[0],
      });

      const result1 = dispatch(action1);
      const result3 = dispatch(action3, result1.state);
      const result4 = dispatch(action4, result3.state);
      const result5 = dispatch(action5, result4.state);
      const result6 = dispatch(action2, result5.state);

      expect(result6).to.deep.equal(result6);
      done();
    });

    it("should setProfileActivityValue for currentActivity for all players and two should be ready", (done) => {
      const action1 = setProfileActivityValue({
        value: questionIds[2],
        profileId: participantProfileIds[0],
        activityId: activityIds[0],
      });
      const action2 = setProfileActivityValue({
        value: questionIds[0],
        profileId: participantProfileIds[1],
        activityId: activityIds[0],
      });
      const action3 = setProfileActivityValue({
        value: questionIds[1],
        profileId: participantProfileIds[2],
        activityId: activityIds[0],
      });
      const timestamp = getUnixTime(new Date());

      const action4 = profileActivityReady({
        profileId: participantProfileIds[1],
        activityId: activityIds[0],
      });
      const action5 = profileActivityReady({
        profileId: participantProfileIds[2],
        activityId: activityIds[0],
      });

      const result1 = dispatch(action1);
      const result2 = dispatch(action2, result1.state);
      const result3 = dispatch(action3, result2.state);
      const result4 = dispatch(action4, result3.state);
      const result5 = dispatch(action5, result4.state);

      expect(result5.state.activityMap).to.deep.equal({
        "1": participantProfileIds.map((profileId, index) => ({
          profileId,
          value:
            index === 0
              ? questionIds[2]
              : index === 1
              ? questionIds[0]
              : questionIds[1],
          ready: index === 0 ? false : true,
        })),
        "2": participantProfileIds.map((profileId) => ({
          profileId,
          value: null,
          ready: false,
        })),
        "3": participantProfileIds.map((profileId) => ({
          profileId,
          value: null,
          ready: false,
        })),
      });
      expect(result5.state.lastUpdateTimestamp).to.equal(timestamp);
      done();
    });

    it("should setProfileActivityValue for currentActivity for all players and all should be ready and we should move to next activity", (done) => {
      const timestamp = getUnixTime(new Date());
      const action1 = setProfileActivityValue({
        value: questionIds[2],
        profileId: participantProfileIds[0],
        activityId: activityIds[0],
      });
      const action2 = setProfileActivityValue({
        value: questionIds[0],
        profileId: participantProfileIds[1],
        activityId: activityIds[0],
      });
      const action3 = setProfileActivityValue({
        value: questionIds[1],
        profileId: participantProfileIds[2],
        activityId: activityIds[0],
      });

      const action4 = profileActivityReady({
        profileId: participantProfileIds[1],
        activityId: activityIds[0],
      });
      const action5 = profileActivityReady({
        profileId: participantProfileIds[2],
        activityId: activityIds[0],
      });
      const action6 = profileActivityReady({
        profileId: participantProfileIds[0],
        activityId: activityIds[0],
      });

      const result1 = dispatch(action1);
      const result2 = dispatch(action2, result1.state);
      const result3 = dispatch(action3, result2.state);
      const result4 = dispatch(action4, result3.state);
      const result5 = dispatch(action5, result4.state);
      const result6 = dispatch(action6, result5.state);

      expect(result6.state.activityMap).to.deep.equal({
        "1": participantProfileIds.map((profileId, index) => ({
          profileId,
          value:
            index === 0
              ? questionIds[2]
              : index === 1
              ? questionIds[0]
              : questionIds[1],
          ready: true,
        })),
        "2": participantProfileIds.map((profileId) => ({
          profileId,
          value: null,
          ready: false,
        })),
        "3": participantProfileIds.map((profileId) => ({
          profileId,
          value: null,
          ready: false,
        })),
      });

      expect(result5.state.currentProfileActivityId).to.equal("1");
      expect(result6.state.currentProfileActivityId).to.equal("2");
      expect(result6.state.lastUpdateTimestamp).to.equal(timestamp);
      done();
    });

    it("should setProfileActivityValue for all activities for all players and all should be finished", (done) => {
      const timestamp = getUnixTime(new Date());
      const profileActivityMode = setActivityMode({
        activityMode: ActivityMode.PROFILE,
      });
      const action1 = setProfileActivityValue({
        value: questionIds[2],
        profileId: participantProfileIds[0],
        activityId: activityIds[0],
      });
      const action2 = setProfileActivityValue({
        value: questionIds[0],
        profileId: participantProfileIds[1],
        activityId: activityIds[0],
      });
      const action3 = setProfileActivityValue({
        value: questionIds[1],
        profileId: participantProfileIds[2],
        activityId: activityIds[0],
      });

      const action4 = profileActivityReady({
        profileId: participantProfileIds[1],
        activityId: activityIds[0],
      });
      const action5 = profileActivityReady({
        profileId: participantProfileIds[2],
        activityId: activityIds[0],
      });
      const action6 = profileActivityReady({
        profileId: participantProfileIds[0],
        activityId: activityIds[0],
      });

      const action7 = setProfileActivityValue({
        value: questionIds[1],
        profileId: participantProfileIds[0],
        activityId: activityIds[1],
      });
      const action8 = setProfileActivityValue({
        value: questionIds[1],
        profileId: participantProfileIds[1],
        activityId: activityIds[1],
      });
      const action9 = setProfileActivityValue({
        value: questionIds[1],
        profileId: participantProfileIds[2],
        activityId: activityIds[1],
      });

      const action10 = profileActivityReady({
        profileId: participantProfileIds[1],
        activityId: activityIds[1],
      });
      const action11 = profileActivityReady({
        profileId: participantProfileIds[2],
        activityId: activityIds[1],
      });
      const action12 = profileActivityReady({
        profileId: participantProfileIds[0],
        activityId: activityIds[1],
      });

      const action13 = setProfileActivityValue({
        value: questionIds[0],
        profileId: participantProfileIds[0],
        activityId: activityIds[2],
      });
      const action14 = setProfileActivityValue({
        value: questionIds[1],
        profileId: participantProfileIds[1],
        activityId: activityIds[2],
      });
      const action15 = setProfileActivityValue({
        value: questionIds[0],
        profileId: participantProfileIds[2],
        activityId: activityIds[2],
      });

      const action16 = profileActivityReady({
        profileId: participantProfileIds[1],
        activityId: activityIds[2],
      });
      const action17 = profileActivityReady({
        profileId: participantProfileIds[2],
        activityId: activityIds[2],
      });
      const action18 = profileActivityReady({
        profileId: participantProfileIds[0],
        activityId: activityIds[2],
      });

      const result1 = dispatch(action1);
      const result2 = dispatch(action2, result1.state);
      const result3 = dispatch(action3, result2.state);
      const result4 = dispatch(action4, result3.state);
      const result5 = dispatch(action5, result4.state);
      const result6 = dispatch(action6, result5.state);
      const profileActivity1 = dispatch(profileActivityMode, result6.state);
      const result7 = dispatch(action7, profileActivity1.state);
      const result8 = dispatch(action8, result7.state);
      const result9 = dispatch(action9, result8.state);
      const result10 = dispatch(action10, result9.state);
      const result11 = dispatch(action11, result10.state);
      const result12 = dispatch(action12, result11.state);
      const profileActivity2 = dispatch(profileActivityMode, result12.state);
      const result13 = dispatch(action13, profileActivity2.state);
      const result14 = dispatch(action14, result13.state);
      const result15 = dispatch(action15, result14.state);
      const result16 = dispatch(action16, result15.state);
      const result17 = dispatch(action17, result16.state);
      const result18 = dispatch(action18, result17.state);

      expect(result18.state.activityMap).to.deep.equal({
        "1": [
          {
            profileId: participantProfileIds[0],
            value: questionIds[2],
            ready: true,
          },
          {
            profileId: participantProfileIds[1],
            value: questionIds[0],
            ready: true,
          },
          {
            profileId: participantProfileIds[2],
            value: questionIds[1],
            ready: true,
          },
        ],
        "2": [
          {
            profileId: participantProfileIds[0],
            value: questionIds[1],
            ready: true,
          },
          {
            profileId: participantProfileIds[1],
            value: questionIds[1],
            ready: true,
          },
          {
            profileId: participantProfileIds[2],
            value: questionIds[1],
            ready: true,
          },
        ],
        "3": [
          {
            profileId: participantProfileIds[0],
            value: questionIds[0],
            ready: true,
          },
          {
            profileId: participantProfileIds[1],
            value: questionIds[1],
            ready: true,
          },
          {
            profileId: participantProfileIds[2],
            value: questionIds[0],
            ready: true,
          },
        ],
      });

      expect(result5.state.currentProfileActivityId).to.equal("1");
      expect(result6.state.currentProfileActivityId).to.equal("2");
      expect(result6.state.activityMode).to.equal(ActivityMode.GROUP);
      expect(profileActivity1.state.activityMode).to.equal(
        ActivityMode.PROFILE
      );

      expect(result11.state.currentProfileActivityId).to.equal("2");
      expect(result12.state.currentProfileActivityId).to.equal("3");
      expect(result12.state.activityMode).to.equal(ActivityMode.GROUP);
      expect(profileActivity2.state.activityMode).to.equal(
        ActivityMode.PROFILE
      );

      expect(result17.state.currentProfileActivityId).to.equal("3");
      expect(result18.state.currentProfileActivityId).to.equal(null);
      expect(result18.state.finished).to.equal(true);
      expect(result18.state.lastUpdateTimestamp).to.equal(timestamp);
      done();
    });
  });
});
