import gql from "graphql-tag";
import {
  ProfileWorkspaceAccess,
  SlotReminderStatus,
  SlotStatus,
  SlotType,
  models,
  profileAssociationNames,
  workshopAssociationNames,
  workspaceAssociationNames,
} from "../../database";
import { getRequestedFields } from "../utils";
import { Includeable } from "sequelize";
import { AppContext, AuthenticatedAppContext } from "../types";
import { authorize } from "../middleware/authorize";

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

  enum SlotReminderStatus {
    FORTHCOMING
    FARAWAY
    NONE
  }

  type Slot {
    ics: String
    ics_uid: String
    key: String
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
    getSlots(workspace_id: String, id: String): [Slot]
  }
`;

export const slotMutationDefs = gql`
  type Mutation {
    createSlot(
      type: SlotType!
      key: String!
      schedule_date: Date!
      workshop_id: String!
      workspace_id: String!
      ics: String
      ics_uid: String
    ): Slot!
    editSlot(
      id: String!
      type: SlotType
      key: String
      schedule_date: Date
      workshop_id: String
      workspace_id: String
      ics: String
      ics_uid: String
      status: SlotStatus
      reminder_status: SlotReminderStatus
    ): Slot
    deleteSlot(id: String!): Slot
  }
`;

function prepareIncludesFromInfo(info: any) {
  const requestedFields = getRequestedFields(info);
  const includeWorkshop = !!requestedFields.workshop;
  const includeWorkspace = !!requestedFields.workspace;
  const includeProfile = !!requestedFields.profile;

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
    data: { id: string; workspaceId: string },
    contextValue: any,
    info: any
  ) {
    const include = prepareIncludesFromInfo(info);
    return models.slot.findAll({ where: { ...data }, include });
  },
};

export const slotMutationResolvers = {
  createSlot: authorize({
    allowedWorkspaceAccess: [
      ProfileWorkspaceAccess.OWNER,
      ProfileWorkspaceAccess.ADMIN,
    ],
  })(
    (
      _: undefined,
      data: {
        type: SlotType;
        key: string;
        schedule_date: Date;
        workshop_id: string;
        workspace_id: string;
        ics: string;
        ics_uid: string;
      },
      contextValue: AuthenticatedAppContext,
      info: any
    ) => {
      const include = prepareIncludesFromInfo(info);
      return models.slot
        .create(
          {
            ...data,
            creator_id: contextValue.decodedProfileData.id,
            reminder_status: SlotReminderStatus.NONE,
            status: SlotStatus.SCHEDULED,
          },
          { returning: true }
        )
        .then((slot) => models.slot.findByPk(slot.id, { include }));
    }
  ),
  editSlot: authorize({
    allowedWorkspaceAccess: [
      ProfileWorkspaceAccess.OWNER,
      ProfileWorkspaceAccess.ADMIN,
    ],
  })(
    (
      _: undefined,
      data: {
        id: string;
        type: SlotType;
        key: string;
        schedule_date: Date;
        workshop_id: string;
        workspace_id: string;
        ics: string;
        ics_uid: string;
        status: SlotStatus;
        reminder_status: SlotReminderStatus;
      },
      contextValue: AppContext,
      info: any
    ) => {
      const include = prepareIncludesFromInfo(info);
      return models.slot
        .update({ ...data }, { where: { id: data.id }, returning: true })
        .then(([, slot]) => models.slot.findByPk(slot[0]?.id, { include }));
    }
  ),
  deleteSlot: authorize({
    allowedWorkspaceAccess: [
      ProfileWorkspaceAccess.OWNER,
      ProfileWorkspaceAccess.ADMIN,
    ],
  })(
    (
      _: undefined,
      data: {
        id: string;
      },
      contextValue: any,
      info: any
    ) => {
      return models.slot
        .findByPk(data.id)
        .then((slot) => slot?.destroy().then(() => slot));
    }
  ),
};
