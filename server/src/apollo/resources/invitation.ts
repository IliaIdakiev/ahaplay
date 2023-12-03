import gql from "graphql-tag";
import {
  SlotType,
  models,
  profileAssociationNames,
  sessionAssociationNames,
  slotAssociationNames,
  workshopAssociationNames,
  workspaceAssociationNames,
} from "../../database";
import { getRequestedFields } from "../utils";
import { Includeable } from "sequelize";
import { AppContext } from "../types";
import { v1 } from "uuid";
import { redisClient } from "../../redis";
import ms from "ms";
import { addMilliseconds, getUnixTime } from "date-fns";
import config from "../../config";
import { InvitationModelInstance } from "../../database/interfaces/invitation";

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
  type GetInvitationResult {
    invitation: Invitation
    millisecondsToStart: Int
  }

  extend type Query {
    getInvitations(
      email: String
      status: String
      profile_id: String
      slot_id: String
    ): [Invitation]

    getInvitation(email: String, slotId: String): GetInvitationResult!
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
    contextValue: AppContext,
    info: any
  ) {
    const include = prepareIncludesFromInfo(info);
    return models.invitation.findAll({ where: { ...data }, include });
  },
  getInvitation(
    _: undefined,
    data: { email: string; slotId: string },
    contextValue: AppContext,
    info: any
  ): Promise<{
    invitation: InvitationModelInstance | null;
    millisecondsToStart: number | null;
  }> {
    const { email, slotId } = data;
    return models.invitation
      .findOne({
        where: { email, slot_id: slotId },
        include: [
          { model: models.profile, as: profileAssociationNames.singular },
          {
            model: models.slot,
            as: slotAssociationNames.singular,
            include: [
              { model: models.session, as: sessionAssociationNames.singular },
              {
                model: models.workshop,
                as: workshopAssociationNames.singular,
              },
              {
                model: models.workspace,
                as: workspaceAssociationNames.singular,
              },
            ],
          },
        ],
      })
      .then((invitation) => {
        if (
          !invitation ||
          !invitation.slot ||
          !invitation.slot.isOpenForSession() ||
          invitation.slot.session ||
          invitation.slot.key
        ) {
          let millisecondsToStart = null;
          if (invitation?.slot?.key) {
            const currentTimestamp = new Date().getTime();
            const startTimestamp =
              parseInt(invitation.slot.key.slice(0, 8), 16) * 1000;

            millisecondsToStart = startTimestamp - currentTimestamp;
          }
          return { invitation, millisecondsToStart };
        }

        const millisecondsToStart =
          invitation.slot.type === SlotType.SPLIT
            ? ms(config.app.splitWaitingTime)
            : 0;

        const sessionStartUUID = v1({
          msecs: addMilliseconds(new Date(), millisecondsToStart).getTime(),
        });

        invitation.slot.set("key", sessionStartUUID);
        return invitation.slot.save().then((updatedSlot) => {
          invitation.slot = updatedSlot;
          return { invitation, millisecondsToStart };
        });
      });
  },
};
