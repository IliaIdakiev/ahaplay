import gql from "graphql-tag";
import { InMemorySessionStage } from "../../../session-processor/types";

export const sessionAndProfileMetadataTypeDefs = gql`
  enum InMemorySessionStage {
    WAITING
    START_EMOTION_CHECK
    TEAM_NAME
    ON_GOING
    END_EMOTION_CHECK
    VIEW_RESULTS
  }
  
  enum ActivityType {
    Theory
    Assignment
    Question
    Benchmark
    Conceptualization
    Concept
  }
  
  type ActivityData {
    id: String
    type: ActivityType
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
    activities: [ActivityData]!
    stages: InMemoryProfileMetadataStages!
    activityMap: [ActivityMapArrayItem]!
    currentActivityId: String
    allActivitiesFinished: Boolean!
    lastUpdateTimestamp: Int!
  }

  type InMemoryProfileMetadataState {
    sessionId: String!
    activities: [ActivityData]!
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
      activityId: String!
      value: String!
    ): InMemoryProfileMetadataState!
    setProfileActivityAsReady(
      sessionId: String!
      activityId: String!
    ): InMemoryProfileMetadataState!
    setGroupActivityValue(
      sessionId: String!
      value: String!
      activityId: String!
    ): InMemorySessionMetadataState!
    setGroupActivityAsReady(
      sessionId: String!
      activityId: String!
    ): InMemorySessionMetadataState!
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
