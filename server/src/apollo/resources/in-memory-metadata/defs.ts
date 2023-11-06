import gql from "graphql-tag";
import { InMemorySessionStage } from "../../../apollo/types";

export const sessionAndProfileMetadataTypeDefs = gql`
  enum InMemorySessionStage {
    WAITING
    START_EMOTION_CHECK
    TEAM_NAME
    ON_GOING
    END_EMOTION_CHECK
    VIEW_RESULTS
  }
  
  type ActivityEntry {
    profileId: String
    value: String
    ready: Boolean
  }
  
  type ActivityMapArrayItem {
    key: String
    value: [ActivityEntry]
  }
  
  type EmotionEntry { 
    emotion: Int!
    profileId: String!
  }

  type InMemoryProfileMetadataStages {
    ${InMemorySessionStage.WAITING}: [String]!
    ${InMemorySessionStage.START_EMOTION_CHECK}: [String]!
    ${InMemorySessionStage.TEAM_NAME}: [String]!
    ${InMemorySessionStage.ON_GOING}: [String]!
    ${InMemorySessionStage.END_EMOTION_CHECK}: [String]!
    ${InMemorySessionStage.VIEW_RESULTS}: [String]!
  }

  type InMemorySessionMetadataState {
    sessionId: String!
    profileIds: [String]!
    connectedProfileIds: [String]!
    participantProfileIds: [String]!
    teamName: String
    currentStage: InMemorySessionStage!
    activityIds: [String]!
    stages: InMemoryProfileMetadataStages!
    activityMap: [ActivityMapArrayItem]!
    currentActivityId: String
    allActivitiesFinished: Boolean!
    lastUpdateTimestamp: Int!
  }

  type InMemoryProfileMetadataState {
    sessionId: String!
    activityIds: [String]!
    activityMap: [ActivityMapArrayItem]!
    currentActivityId: String
    finished: Boolean
    startEmotions: [EmotionEntry]!
    endEmotions: [EmotionEntry]!
    lastUpdateTimestamp: Int!
  }
`;

export const sessionMutationDefs = gql`
  type Mutation {
    setProfileAsSessionParticipant(
      sessionId: String!
    ): InMemorySessionMetadataState!
    unsetProfileAsSessionParticipant(
      sessionId: String!
    ): InMemorySessionMetadataState!
    readyToStart(sessionId: String!): InMemorySessionMetadataState!
    setTeamName(
      sessionId: String!
      teamName: String!
    ): InMemorySessionMetadataState!
    setTeamNameAsReady(sessionId: String!): InMemorySessionMetadataState!
    setStartEmotion(
      sessionId: String!
      emotion: Int!
    ): InMemoryProfileMetadataState!
    setStartEmotionAsReady(sessionId: String!): InMemoryProfileMetadataState!
    setEndEmotion(
      sessionId: String!
      emotion: Int!
    ): InMemoryProfileMetadataState!
    setEndEmotionAsReady(sessionId: String!): InMemoryProfileMetadataState!

    setProfileActivityValue(
      sessionId: String!
      value: String!
    ): InMemoryProfileMetadataState!
    setProfileActivityAsReady(sessionId: String!): InMemoryProfileMetadataState!
    setGroupActivityValue(
      sessionId: String!
      value: String!
    ): InMemorySessionMetadataState!
    setGroupActivityAsReady(sessionId: String!): InMemorySessionMetadataState!
  }
`;

export const sessionSubscriptionDefs = gql`
  type Subscription {
    inMemorySessionMetadataState(
      slotId: String!
      sessionId: String
    ): InMemorySessionMetadataState
    inMemoryProfileMetadataState(
      sessionId: String!
    ): InMemoryProfileMetadataState
  }
`;
