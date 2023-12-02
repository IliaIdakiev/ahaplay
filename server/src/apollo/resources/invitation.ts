import gql from "graphql-tag";
import {
  models,
  profileAssociationNames,
  slotAssociationNames,
} from "../../database";
import { getRequestedFields } from "../utils";
import { Includeable } from "sequelize";

export const invitationTypeDefs = gql`
  type Invitation {
    email: String
    status: String
    emails_count: String
    profile_id: String
    slot_id: String
    profile: Profile
    slot: Slot
  }
`;

export const invitationQueryDefs = gql`
  extend type Query {
    getInvitations(
      email: String
      status: String
      profile_id: String
      slot_id: String
    ): [Invitation]
  }
`;

function prepareIncludesFromInfo(info: any) {
  const requestedFields = getRequestedFields(info);
  const includeProfile = !!requestedFields.profile;
  const includeSlot = !!requestedFields.slot;

  const include: Includeable[] = [];

  if (includeProfile) {
    include.push({
      model: models.profile,
      as: profileAssociationNames.singular,
    });
  }
  if (includeSlot) {
    include.push({
      model: models.slot,
      as: slotAssociationNames.singular,
    });
  }

  return include;
}

export const invitationQueryResolvers = {
  getInvitations(
    _: undefined,
    data: { id: string; email: string; active_invitation_id: string },
    contextValue: any,
    info: any
  ) {
    const include = prepareIncludesFromInfo(info);
    return models.invitation.findAll({ where: { ...data }, include });
  },
};
