import gql from "graphql-tag";
import {
  models,
  profileAssociationNames,
  workshopAssociationNames,
  workspaceAssociationNames,
} from "../../database";
import { extractRequestedFieldsFromInfo } from "../utils";
import { Includeable } from "sequelize";

export const slotTypeDefs = gql`
  enum SlotType {
    ALL
    SPLIT
  }

  enum SlotStatus {
    SCHEDULED
    RESCHEDULED
    CANCELLED
    WAITING
    ONGOING
    NOT_ENOUGH_PLAYERS
    COMPLETED
  }

  type Slot {
    ics: String
    ics_uid: String
    key: String!
    reminder_status: String
    schedule_date: Date!
    status: SlotStatus!
    creator_id: String!
    workshop_id: String!
    workspace_id: String!
    type: SlotType!

    workspace: Workspace
    workshop: Workshop
    profile: Profile
  }
`;

export const slotQueryDefs = gql`
  extend type Query {
    getSlots(id: String, creator_id: String): [Slot]
  }
`;

function prepareIncludesFromInfo(info: any) {
  const requestedFields = extractRequestedFieldsFromInfo(info);
  const includeWorkshop = requestedFields.includes("workshop");
  const includeWorkspace = requestedFields.includes("workspace");
  const includeProfile = requestedFields.includes("profile");

  const include: Includeable[] = [];
  if (includeWorkshop) {
    include.push({
      model: models.workshop,
      as: workshopAssociationNames.singular,
    });
  }
  if (includeWorkspace) {
    include.push({
      model: models.workspace,
      as: workspaceAssociationNames.singular,
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

export const slotQueryResolvers = {
  getSlots(
    _: undefined,
    data: { id: string; creator_id: string },
    contextValue: any,
    info: any
  ) {
    const include = prepareIncludesFromInfo(info);
    return models.slot.findAll({ where: { ...data }, include });
  },
};
