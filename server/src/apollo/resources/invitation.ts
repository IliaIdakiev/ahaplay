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
import { v1, v4 } from "uuid";
import config from "../../config";
import { authenticate } from "../middleware/authenticate";
import { redisClient } from "../../redis";
import { raceWithSubscription } from "../../utils";
import {
  WorkshopDistributionResult,
  WorkshopDistributorRequestAddMessage,
  WorkshopDistributorRequestType,
} from "../../types/distribution-message";
import {
  workshopDistributorRequestChannel,
  workshopDistributorResponseChannel,
} from "../../constants";

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

      const processingGetInvitationKey = `processing_get_invitation:${slot_id}`;
      const processingGetInvitationEventName = `processing_get_invitation_event:${slot_id}`;

      const findInvitation = () =>
        models.invitation.findOne({
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
        });

      const subscriptionCompetitor = findInvitation;

      const { subscription, publish, force } = raceWithSubscription(
        pubSub,
        processingGetInvitationEventName,
        subscriptionCompetitor,
        (invitation) =>
          invitation?.slot?.isOpenForSession() ? !!invitation?.slot?.key : true
      );

      return (
        redisClient
          .setNX(processingGetInvitationKey, "yes")
          .then((wasWritten) => (wasWritten ? null : subscription))
          // INFO:
          // here always find invitation since we cannot count on the published value bellow
          // because it won't have the "isOpenForSession" property because publish will json stringify it
          .then(() => findInvitation())
          .then((invitation) => {
            const distributionCall =
              invitation?.slot?.type === SlotType.SPLIT
                ? (
                    invitationId: string,
                    sessionKey: string,
                    slotId: string
                  ) => {
                    const distributionMessage: WorkshopDistributorRequestAddMessage =
                      {
                        uuid: v1(),
                        data: {
                          profileId: id,
                          sessionKey,
                          slotId,
                          invitationId,
                        },
                        type: WorkshopDistributorRequestType.ADD,
                      };
                    pubSub.publish(
                      workshopDistributorRequestChannel,
                      distributionMessage
                    );
                    return new Promise<WorkshopDistributionResult>(
                      (res, rej) => {
                        let subscriptionId: number;
                        const handler = (
                          message: WorkshopDistributionResult
                        ) => {
                          if (message.uuid !== distributionMessage.uuid) return;
                          pubSub.unsubscribe(subscriptionId);
                          if (message.error) return void rej(message.error);
                          res(message);
                        };
                        pubSub
                          .subscribe(
                            workshopDistributorResponseChannel,
                            handler
                          )
                          .then((id) => (subscriptionId = id));
                      }
                    );
                  }
                : () => Promise.resolve(null);

            if (
              !invitation ||
              !invitation.slot ||
              !invitation.slot.isOpenForSession() ||
              invitation.slot.session ||
              invitation.slot.key
            ) {
              let millisecondsToStart: number | null = null;
              let distributionCallResult:
                | Promise<null>
                | Promise<WorkshopDistributionResult> = Promise.resolve(null);
              if (invitation?.slot?.key) {
                const keyParts = invitation.slot.key.split("-");
                const startTimestamp = +keyParts[keyParts.length - 1];
                const currentTimestamp = getUnixTime(Date.now());
                millisecondsToStart =
                  (startTimestamp - currentTimestamp) * 1000;
                distributionCallResult = distributionCall(
                  invitation.id,
                  invitation.slot.key,
                  invitation.slot_id
                );
              }

              return distributionCallResult.then(() => ({
                invitation,
                millisecondsToStart,
              }));
            }

            const additionalMillisecondsToStart =
              invitation.slot.type === SlotType.SPLIT
                ? ms(config.workshop.splitWaitingTime)
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
                invitation.slot = updatedSlot;
                return distributionCall(
                  invitation.id,
                  invitation.slot.key,
                  invitation.slot_id
                ).then(() => invitation);
              })
              .then((invitation) => ({
                invitation,
                millisecondsToStart,
                group: null,
              }));
          })
          .then((result) => {
            redisClient
              .del(processingGetInvitationKey)
              .then((removed) =>
                removed > 0 ? publish(result.invitation) : undefined
              );
            return result;
          })
          .catch((error) => {
            force();
            return error;
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
