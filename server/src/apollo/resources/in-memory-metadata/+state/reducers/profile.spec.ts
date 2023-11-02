import { expect } from "chai";
import {
  InMemoryProfileMetadataState,
  createProfileReducerInitialState,
  getProfileReducer,
} from "./profile";
import { profileActivityReady, setProfileActivityValue } from "../actions";
import { getUnixTime } from "date-fns";

describe("Apollo > Resources > In Memory Profile Metadata", () => {
  const activityIds = ["1", "2", "3"];
  const profileIds = ["profile1", "profile2", "profile3"];
  const questionIds = ["question1", "question2", "question3"];
  const startEmotions = profileIds.map((profileId) => ({
    profileId,
    emotion: 1,
  }));
  const endEmotions = profileIds.map((profileId) => ({
    profileId,
    emotion: 4,
  }));
  let initialState: InMemoryProfileMetadataState;
  let dispatch: ReturnType<typeof getProfileReducer>;
  let initialTimestamp: number;

  beforeEach(() => {
    initialState = createProfileReducerInitialState({
      activityIds,
      profileIds,
    });
    initialTimestamp = getUnixTime(new Date());
    dispatch = getProfileReducer(initialState);
  });

  describe("state creation", () => {
    it("should createProfileReducerInitialState initial", (done) => {
      expect(initialState.activityIds).to.deep.equal(activityIds);
      expect(initialState.currentActivityId).to.equal(activityIds[0]);
      expect(initialState.activityMap).to.deep.equal({
        "1": profileIds.map((profileId) => ({
          profileId,
          questionId: null,
          ready: false,
        })),
        "2": profileIds.map((profileId) => ({
          profileId,
          questionId: null,
          ready: false,
        })),
        "3": profileIds.map((profileId) => ({
          profileId,
          questionId: null,
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
          [activityId]: profileIds.map((profileId, index) => ({
            profileId,
            questionId: questionIds[index],
            ready: true,
          })),
        }),
        {}
      );
      const timestamp = getUnixTime(new Date());

      initialState = createProfileReducerInitialState({
        activityIds,
        profileIds,
        activityMap,
        lastUpdateTimestamp: timestamp,
        startEmotions,
        endEmotions,
      });

      expect(initialState.activityIds).to.deep.equal(activityIds);
      expect(initialState.currentActivityId).to.equal(activityIds[2]);
      expect(initialState.activityMap).to.deep.equal({
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
          [activityId]: profileIds.map((profileId, pIndex) => ({
            profileId,
            questionId: index < 2 ? questionIds[pIndex] : null,
            ready: index < 2,
          })),
        }),
        {}
      );
      const timestamp = getUnixTime(new Date());
      initialState = createProfileReducerInitialState({
        activityIds,
        profileIds,
        activityMap,
        lastUpdateTimestamp: timestamp,
        startEmotions,
        endEmotions,
      });

      expect(initialState.activityIds).to.deep.equal(activityIds);
      expect(initialState.currentActivityId).to.equal(activityIds[2]);
      expect(initialState.activityMap).to.deep.equal({
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
        "3": profileIds.map((profileId) => ({
          profileId,
          questionId: null,
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
          [activityId]: profileIds.map((profileId, pIndex) => ({
            profileId,
            questionId:
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
        profileIds,
        activityMap,
        lastUpdateTimestamp: timestamp,
        startEmotions,
        endEmotions,
      });

      expect(initialState.activityIds).to.deep.equal(activityIds);
      expect(initialState.currentActivityId).to.equal(activityIds[1]);
      expect(initialState.activityMap).to.deep.equal({
        "1": profileIds.map((profileId, index) => ({
          profileId,
          questionId: questionIds[index],
          ready: true,
        })),
        "2": profileIds.map((profileId, index) => ({
          profileId,
          questionId: index < 2 ? questionIds[index] : null,
          ready: index < 2,
        })),
        "3": profileIds.map((profileId) => ({
          profileId,
          questionId: null,
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
      const currentActivityId = initialState.currentActivityId;
      const timestamp = getUnixTime(new Date());
      const action = setProfileActivityValue({
        questionId: questionIds[2],
        profileId: profileIds[1],
      });
      const updatedState = dispatch(action);
      expect(
        updatedState.activityMap[currentActivityId!].find(
          (a) => a.profileId === profileIds[1]
        )
      ).to.deep.equal({
        questionId: questionIds[2],
        profileId: profileIds[1],
        ready: false,
      });
      expect(updatedState.lastUpdateTimestamp).to.equal(timestamp);
      done();
    });

    it("should setProfileActivityValue for currentActivity for all players", (done) => {
      const timestamp = getUnixTime(new Date());
      const action1 = setProfileActivityValue({
        questionId: questionIds[2],
        profileId: profileIds[0],
      });
      const action2 = setProfileActivityValue({
        questionId: questionIds[0],
        profileId: profileIds[1],
      });
      const action3 = setProfileActivityValue({
        questionId: questionIds[1],
        profileId: profileIds[2],
      });

      const updatedState1 = dispatch(action1);
      const updatedState2 = dispatch(action2, updatedState1);
      const updatedState3 = dispatch(action3, updatedState2);

      expect(updatedState3.lastUpdateTimestamp).to.equal(timestamp);
      expect(updatedState3.activityMap).to.deep.equal({
        "1": profileIds.map((profileId, index) => ({
          profileId,
          questionId:
            index === 0
              ? questionIds[2]
              : index === 1
              ? questionIds[0]
              : questionIds[1],
          ready: false,
        })),
        "2": profileIds.map((profileId) => ({
          profileId,
          questionId: null,
          ready: false,
        })),
        "3": profileIds.map((profileId) => ({
          profileId,
          questionId: null,
          ready: false,
        })),
      });
      done();
    });

    it("should not set activity to ready because there is no value", (done) => {
      const action1 = setProfileActivityValue({
        questionId: questionIds[2],
        profileId: profileIds[0],
      });
      const action2 = profileActivityReady({
        profileId: profileIds[1],
      });
      const action3 = setProfileActivityValue({
        questionId: questionIds[1],
        profileId: profileIds[2],
      });

      const action4 = profileActivityReady({ profileId: profileIds[1] });
      const action5 = profileActivityReady({ profileId: profileIds[2] });

      const updatedState1 = dispatch(action1);
      const updatedState3 = dispatch(action3, updatedState1);
      const updatedState4 = dispatch(action4, updatedState3);
      const updatedState5 = dispatch(action5, updatedState4);
      const updatedState6 = dispatch(action2, updatedState5);

      expect(updatedState6).to.deep.equal(updatedState6);
      done();
    });

    it("should setProfileActivityValue for currentActivity for all players and two should be ready", (done) => {
      const action1 = setProfileActivityValue({
        questionId: questionIds[2],
        profileId: profileIds[0],
      });
      const action2 = setProfileActivityValue({
        questionId: questionIds[0],
        profileId: profileIds[1],
      });
      const action3 = setProfileActivityValue({
        questionId: questionIds[1],
        profileId: profileIds[2],
      });
      const timestamp = getUnixTime(new Date());

      const action4 = profileActivityReady({ profileId: profileIds[1] });
      const action5 = profileActivityReady({ profileId: profileIds[2] });

      const updatedState1 = dispatch(action1);
      const updatedState2 = dispatch(action2, updatedState1);
      const updatedState3 = dispatch(action3, updatedState2);
      const updatedState4 = dispatch(action4, updatedState3);
      const updatedState5 = dispatch(action5, updatedState4);

      expect(updatedState5.activityMap).to.deep.equal({
        "1": profileIds.map((profileId, index) => ({
          profileId,
          questionId:
            index === 0
              ? questionIds[2]
              : index === 1
              ? questionIds[0]
              : questionIds[1],
          ready: index === 0 ? false : true,
        })),
        "2": profileIds.map((profileId) => ({
          profileId,
          questionId: null,
          ready: false,
        })),
        "3": profileIds.map((profileId) => ({
          profileId,
          questionId: null,
          ready: false,
        })),
      });
      expect(updatedState5.lastUpdateTimestamp).to.equal(timestamp);
      done();
    });

    it("should setProfileActivityValue for currentActivity for all players and all should be ready and we should move to next activity", (done) => {
      const timestamp = getUnixTime(new Date());
      const action1 = setProfileActivityValue({
        questionId: questionIds[2],
        profileId: profileIds[0],
      });
      const action2 = setProfileActivityValue({
        questionId: questionIds[0],
        profileId: profileIds[1],
      });
      const action3 = setProfileActivityValue({
        questionId: questionIds[1],
        profileId: profileIds[2],
      });

      const action4 = profileActivityReady({ profileId: profileIds[1] });
      const action5 = profileActivityReady({ profileId: profileIds[2] });
      const action6 = profileActivityReady({ profileId: profileIds[0] });

      const updatedState1 = dispatch(action1);
      const updatedState2 = dispatch(action2, updatedState1);
      const updatedState3 = dispatch(action3, updatedState2);
      const updatedState4 = dispatch(action4, updatedState3);
      const updatedState5 = dispatch(action5, updatedState4);
      const updatedState6 = dispatch(action6, updatedState5);

      expect(updatedState6.activityMap).to.deep.equal({
        "1": profileIds.map((profileId, index) => ({
          profileId,
          questionId:
            index === 0
              ? questionIds[2]
              : index === 1
              ? questionIds[0]
              : questionIds[1],
          ready: true,
        })),
        "2": profileIds.map((profileId) => ({
          profileId,
          questionId: null,
          ready: false,
        })),
        "3": profileIds.map((profileId) => ({
          profileId,
          questionId: null,
          ready: false,
        })),
      });

      expect(updatedState5.currentActivityId).to.equal("1");
      expect(updatedState6.currentActivityId).to.equal("2");
      expect(updatedState6.lastUpdateTimestamp).to.equal(timestamp);
      done();
    });

    it("should setProfileActivityValue for all activities for all players and all should be finished", (done) => {
      const timestamp = getUnixTime(new Date());
      const action1 = setProfileActivityValue({
        questionId: questionIds[2],
        profileId: profileIds[0],
      });
      const action2 = setProfileActivityValue({
        questionId: questionIds[0],
        profileId: profileIds[1],
      });
      const action3 = setProfileActivityValue({
        questionId: questionIds[1],
        profileId: profileIds[2],
      });

      const action4 = profileActivityReady({ profileId: profileIds[1] });
      const action5 = profileActivityReady({ profileId: profileIds[2] });
      const action6 = profileActivityReady({ profileId: profileIds[0] });

      const action7 = setProfileActivityValue({
        questionId: questionIds[1],
        profileId: profileIds[0],
      });
      const action8 = setProfileActivityValue({
        questionId: questionIds[1],
        profileId: profileIds[1],
      });
      const action9 = setProfileActivityValue({
        questionId: questionIds[1],
        profileId: profileIds[2],
      });

      const action10 = profileActivityReady({ profileId: profileIds[1] });
      const action11 = profileActivityReady({ profileId: profileIds[2] });
      const action12 = profileActivityReady({ profileId: profileIds[0] });

      const action13 = setProfileActivityValue({
        questionId: questionIds[0],
        profileId: profileIds[0],
      });
      const action14 = setProfileActivityValue({
        questionId: questionIds[1],
        profileId: profileIds[1],
      });
      const action15 = setProfileActivityValue({
        questionId: questionIds[0],
        profileId: profileIds[2],
      });

      const action16 = profileActivityReady({ profileId: profileIds[1] });
      const action17 = profileActivityReady({ profileId: profileIds[2] });
      const action18 = profileActivityReady({ profileId: profileIds[0] });

      const updatedState1 = dispatch(action1);
      const updatedState2 = dispatch(action2, updatedState1);
      const updatedState3 = dispatch(action3, updatedState2);
      const updatedState4 = dispatch(action4, updatedState3);
      const updatedState5 = dispatch(action5, updatedState4);
      const updatedState6 = dispatch(action6, updatedState5);
      const updatedState7 = dispatch(action7, updatedState6);
      const updatedState8 = dispatch(action8, updatedState7);
      const updatedState9 = dispatch(action9, updatedState8);
      const updatedState10 = dispatch(action10, updatedState9);
      const updatedState11 = dispatch(action11, updatedState10);
      const updatedState12 = dispatch(action12, updatedState11);
      const updatedState13 = dispatch(action13, updatedState12);
      const updatedState14 = dispatch(action14, updatedState13);
      const updatedState15 = dispatch(action15, updatedState14);
      const updatedState16 = dispatch(action16, updatedState15);
      const updatedState17 = dispatch(action17, updatedState16);
      const updatedState18 = dispatch(action18, updatedState17);

      expect(updatedState18.activityMap).to.deep.equal({
        "1": [
          {
            profileId: profileIds[0],
            questionId: questionIds[2],
            ready: true,
          },
          {
            profileId: profileIds[1],
            questionId: questionIds[0],
            ready: true,
          },
          {
            profileId: profileIds[2],
            questionId: questionIds[1],
            ready: true,
          },
        ],
        "2": [
          {
            profileId: profileIds[0],
            questionId: questionIds[1],
            ready: true,
          },
          {
            profileId: profileIds[1],
            questionId: questionIds[1],
            ready: true,
          },
          {
            profileId: profileIds[2],
            questionId: questionIds[1],
            ready: true,
          },
        ],
        "3": [
          {
            profileId: profileIds[0],
            questionId: questionIds[0],
            ready: true,
          },
          {
            profileId: profileIds[1],
            questionId: questionIds[1],
            ready: true,
          },
          {
            profileId: profileIds[2],
            questionId: questionIds[0],
            ready: true,
          },
        ],
      });

      expect(updatedState5.currentActivityId).to.equal("1");
      expect(updatedState6.currentActivityId).to.equal("2");

      expect(updatedState11.currentActivityId).to.equal("2");
      expect(updatedState12.currentActivityId).to.equal("3");

      expect(updatedState17.currentActivityId).to.equal("3");
      expect(updatedState18.currentActivityId).to.equal(null);
      expect(updatedState18.finished).to.equal(true);
      expect(updatedState18.lastUpdateTimestamp).to.equal(timestamp);
      done();
    });
  });
});
