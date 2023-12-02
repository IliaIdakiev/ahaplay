import gql from "graphql-tag";
import { getRequestedFields } from "../../utils";
import { Includeable } from "sequelize";
import {
  models,
  profileAssociationNames,
  slotAssociationNames,
  workshopAssociationNames,
  workspaceAssociationNames,
} from "../../../database";

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

function prepareIncludesFromInfo(info: any) {
  const requestedFields = getRequestedFields(info);
  const includeWorkspace = !!requestedFields.workspace;
  const includeWorkshop = !!requestedFields.workshop;
  const includeSlot = !!requestedFields.slot;
  const includeProfile = !!requestedFields.profile;

  const include: Includeable[] = [];

  if (includeWorkspace) {
    include.push({
      model: models.workspace,
      as: workspaceAssociationNames.singular,
    });
  }
  if (includeWorkshop) {
    include.push({
      model: models.workshop,
      as: workshopAssociationNames.singular,
    });
  }
  if (includeSlot) {
    include.push({
      model: models.slot,
      as: slotAssociationNames.singular,
    });
  }
  if (includeProfile) {
    include.push({
      model: models.profile,
      as: profileAssociationNames.singular,
    });
  }

  return include;
}

export const sessionQueryResolvers = {
  getSessions(
    _: undefined,
    data: { id: string },
    contextValue: any,
    info: any
  ) {
    const include = prepareIncludesFromInfo(info);
    return models.activity.findAll({ where: { ...data }, include });
  },
};

export const sessionQueryDefs = gql`
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
  }
`;

export const sessionSubscriptionDefs = gql`
  type Subscription {
    sessionState(sessionId: String): SessionState
  }
`;
