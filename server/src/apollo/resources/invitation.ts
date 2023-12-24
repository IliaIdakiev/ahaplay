import gql from "graphql-tag";
import {
  ProfileWorkspaceAccess,
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
import { AppContext, AuthenticatedAppContext } from "../types";
import { InvitationModelInstance } from "../../database/interfaces/invitation";
import { authorize } from "../middleware/authorize";
import { addMilliseconds, getUnixTime } from "date-fns";
import ms from "ms";
import { v4 } from "uuid";
import config from "../../config";
import { authenticate } from "../middleware/authenticate";
import { redisClient } from "../../redis";

export const invitationTypeDefs = gql`
  type Invitation {
    email: String!
    status: String!
    emails_count: Int!
    profile_id: String!
    slot_id: String!
    profile: Profile!
    slot: Slot!
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

    getInvitation(email: String, slot_id: String): GetInvitationResult!
  }
`;

export const invitationMutationDefs = gql`
  extend type Mutation {
    createInvitation(email: String, slot_id: String): Invitation!
  }
`;

function prepareIncludesFromInfo(info: any, nestedField?: string | undefined) {
  let requestedFields = getRequestedFields(info);
  requestedFields = nestedField
    ? requestedFields[nestedField]
    : requestedFields;

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
    data: { id: string; email: string },
    contextValue: AppContext,
    info: any
  ) {
    const include = prepareIncludesFromInfo(info);
    return models.invitation.findAll({ where: { ...data }, include });
  },
  getInvitation: authenticate(
    (
      _: undefined,
      data: { email: string; slot_id: string },
      contextValue: AuthenticatedAppContext,
      info: any
    ): Promise<{
      invitation: InvitationModelInstance | null;
      millisecondsToStart: number | null;
    }> => {
      const { email, slot_id } = data;
      const {
        decodedProfileData: { id },
        pubSub,
      } = contextValue;

      process.nextTick(() => {
        redisClient.set(`processing_slot:${slot_id}`, "yes");
      });
      return redisClient
        .get(`processing_slot:${slot_id}`)
        .then((isCurrentSlotBeingProcessed) => {
          if (isCurrentSlotBeingProcessed !== "yes") return;
          return new Promise((res, rej) => {
            let subscriptionId: number;
            pubSub
              .subscribe(`processing_slot_key:${slot_id}`, (value) => {
                res(value);
                pubSub.unsubscribe(subscriptionId);
              })
              .then((id) => (subscriptionId = id))
              .catch((err) => rej(err));
          });
        })
        .then(() =>
          models.invitation
            .findOne({
              where: { email, slot_id, profile_id: id },
              include: [
                { model: models.profile, as: profileAssociationNames.singular },
                {
                  model: models.slot,
                  as: slotAssociationNames.singular,
                  include: [
                    {
                      model: models.session,
                      as: sessionAssociationNames.singular,
                    },
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
                  const keyParts = invitation.slot.key.split("-");
                  const startTimestamp = +keyParts[keyParts.length - 1];
                  const currentTimestamp = getUnixTime(Date.now());
                  millisecondsToStart =
                    (startTimestamp - currentTimestamp) * 1000;
                }

                pubSub.publish(
                  `processing_slot_key:${slot_id}`,
                  invitation?.slot?.key || null
                );

                return { invitation, millisecondsToStart };
              }

              const additionalMillisecondsToStart =
                invitation.slot.type === SlotType.SPLIT
                  ? ms(config.app.splitWaitingTime)
                  : 0;

              const startingUnixTimestamp = getUnixTime(
                addMilliseconds(
                  invitation.slot.schedule_date,
                  additionalMillisecondsToStart
                )
              );
              const sessionStartUUID = `${v4()}-${startingUnixTimestamp}`;

              const currentTimestamp = getUnixTime(Date.now());
              const millisecondsToStart =
                (startingUnixTimestamp - currentTimestamp) * 1000;

              invitation.slot.set("key", sessionStartUUID);
              return invitation.slot
                .save()
                .then((updatedSlot) => {
                  pubSub.publish(
                    `processing_slot_key:${slot_id}`,
                    updatedSlot.key
                  );
                  redisClient.del(`processing_slot:${slot_id}`);

                  invitation.slot = updatedSlot;
                  return invitation;
                })
                .then((invitation) => ({
                  invitation,
                  millisecondsToStart,
                }));
            })
        );
    }
  ),
};

export const invitationMutationResolvers = {
  createInvitation: authorize({
    allowedWorkspaceAccess: [
      ProfileWorkspaceAccess.OWNER,
      ProfileWorkspaceAccess.ADMIN,
    ],
  })(
    (
      _: undefined,
      data: { email: string; slot_id: string },
      contextValue: AuthenticatedAppContext,
      info: any
    ): Promise<InvitationModelInstance> => {
      const include = prepareIncludesFromInfo(info);
      return models.profile
        .findOne({ where: { email: data.email } })
        .then((profile) => {
          if (!profile) throw new Error("SOME ERROR THAT I NEED TO CREATE");
          return models.invitation
            .create(
              { ...data, profile_id: profile.id },
              { returning: true, include }
            )
            .then((invitation) =>
              models.invitation.findByPk(invitation.id, { include })
            )
            .then((invitation) => invitation!);
        });
    }
  ),
};
