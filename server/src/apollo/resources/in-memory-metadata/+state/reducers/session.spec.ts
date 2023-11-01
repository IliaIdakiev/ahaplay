import { expect } from "chai";
import {
  InMemorySessionMetadataState,
  createSessionReducerInitialState,
  getSessionReducer,
} from "./session";
import { InMemorySessionStage } from "../../../../../redis/types";

describe("Apollo > Resources > In Memory Metadata", () => {
  const activityIds = ["1", "2", "3"];
  const profileIds = ["profile1", "profile2", "profile3"];
  const questionIds = ["question1", "question2", "question3"];
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
    it.only("should check initial value", (done) => {
      expect(initialState.participantProfileIds).to.deep.equal(profileIds);
      expect(initialState.currentActivityId).to.equal(activityIds[0]);
      expect(initialState.currentStage).to.equal(InMemorySessionStage.WAITING);
      expect(initialState.teamName).to.equal(null);
      expect(initialState.allActivitiesFinished).to.equal(false);
      expect(initialState.stages).to.equal(false);
      expect(initialState.activityMap).to.equal(false);

      done();
    });
  });
});
