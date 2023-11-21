import gql from "graphql-tag";

export const sessionTypeDefs = gql`
  type ActivityEntry {
    profileId: String
    value: String
    ready: Boolean
  }

  type MapItem {
    key: String
    value: [ActivityEntry]
  }

  type ActivityMapItem {
    key: String
    value: [MapItem]
  }

  type SessionContext {
    currentActiveProfiles: [String]!
    readyActiveProfiles: [String]!
    activityResult: [ActivityMapItem]!
    lastUpdatedTimestamp: Float
  }

  type SessionState {
    value: String!
    context: SessionContext!
  }
`;

export const sessionMutationDefs = gql`
  type Mutation {
    join(sessionId: String!): SessionState!
    disconnect(sessionId: String!): SessionState!
    readyToStart(sessionId: String!): SessionState!

    setActivityValue(
      sessionId: String!
      activityId: String!
      value: String!
    ): SessionState!

    setActivityReady(sessionId: String!, activityId: String!): SessionState!
  }
`;

export const sessionSubscriptionDefs = gql`
  type Subscription {
    sessionState(sessionId: String): SessionState
  }
`;
