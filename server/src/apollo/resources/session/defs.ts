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

  enum SessionStatus {
    SCHEDULED
    INSTANT
    ONGOING
    COMPLETED
  }

  type Session {
    id: String
    create_date: Date
    update_date: Date
    complete_date: Date
    session_key: String!
    completed_activities: Int
    state: String
    team_name: String
    team_play_time: Int
    team_points: Int
    total_activities: Int
    winner_points: Int
    status: SessionStatus!

    slot_id: String
    creator_id: String!
    workshop_id: String!
    workspace_id: String!

    slot: Slot
    profile: Profile
    workshop: Workshop
    workspace: Workspace
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

export const sessionQueryDefs = gql`
  type SessionResult {
    session: Session
    millisecondsToStart: Int
  }

  extend type Query {
    getSessions(
      id: String
      session_key: String
      state: String
      status: String
      slot_id: String
      creator_id: String
      workshop_id: String
      workspace_id: String
    ): [Session]

    getSession(session_key: String!): SessionResult!
  }
`;

export const sessionSubscriptionDefs = gql`
  type Subscription {
    sessionState(sessionId: String): SessionState
  }
`;
