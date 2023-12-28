import { Includeable } from "sequelize";
import {
  models,
  workspaceAssociationNames,
  workshopAssociationNames,
  slotAssociationNames,
  profileAssociationNames,
  SessionModelInstance,
  SessionStatus,
} from "../../../database";
import { getRequestedFields } from "../../utils";
import { AppContext, AuthenticatedAppContext } from "../../types";
import { startSessionProcess } from "../../../session-processor/process";
import { getUnixTime } from "date-fns";
import { authenticate } from "../../middleware/authenticate";
import { redisClient } from "../../../redis";
import { raceWithSubscription } from "../../../utils";
import {
  WorkshopDistributionResult,
  WorkshopDistributorRequestGetMessage,
  WorkshopDistributorRequestType,
} from "../../../types/distribution-message";
import { v1 } from "uuid";
import {
  workshopDistributorRequestChannel,
  workshopDistributorResponseChannel,
} from "../../../constants";

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
    contextValue: AppContext,
    info: any
  ) {
    const include = prepareIncludesFromInfo(info);
    return models.session.findAll({ where: { ...data }, include });
  },
  getSession: authenticate(
    (
      _: undefined,
      data: { session_key: string },
      contextValue: AuthenticatedAppContext,
      info: any
    ): Promise<{
      session: SessionModelInstance | null;
      millisecondsToStart: number | null;
    }> => {
      const { session_key } = data;
      const {
        pubSub,
        decodedProfileData: { id: profileId },
      } = contextValue;

      // NOTE:
      // We always try to get the distribution result and if it exists then it's a SPLIT session
      // if not then it's a ALL session

      const distributionMessage: WorkshopDistributorRequestGetMessage = {
        uuid: v1(),
        data: {
          profileId,
          sessionKey: session_key,
        },
        type: WorkshopDistributorRequestType.GET,
      };
      pubSub.publish(workshopDistributorRequestChannel, distributionMessage);

      const distributionResultPromise = new Promise<WorkshopDistributionResult>(
        (res, rej) => {
          let subscriptionId: number;
          const handler = (message: WorkshopDistributionResult) => {
            if (message.uuid !== distributionMessage.uuid) return;
            pubSub.unsubscribe(subscriptionId);
            if (message.error) return void rej(message.error);
            res(message);
          };
          pubSub
            .subscribe(workshopDistributorResponseChannel, handler)
            .then((id) => (subscriptionId = id));
        }
      );

      return distributionResultPromise.then((distributionResult) => {
        const currentSessionKey =
          distributionResult.data?.splitSessionKey || session_key;
        const processingGetSessionKey = `processing_get_session:${currentSessionKey}`;
        const processingGetSessionEventName = `processing_get_session_event:${currentSessionKey}`;

        const findSessionForSessionKey = () =>
          models.session.findOne({
            where: { session_key: currentSessionKey },
          });

        const subscriptionCompetitor = findSessionForSessionKey;

        const { subscription, publish, force } = raceWithSubscription(
          pubSub,
          processingGetSessionEventName,
          subscriptionCompetitor
        );

        const handler: Promise<{
          session: SessionModelInstance | null;
          millisecondsToStart: number | null;
        }> = redisClient
          .setNX(processingGetSessionKey, "yes")
          .then((wasWritten) => (wasWritten ? null : subscription))
          // INFO:
          // here always read the session again since because otherwise sometimes the created_date is null
          .then(() => findSessionForSessionKey())
          .then((session) => {
            if (session) {
              const keyParts = session.session_key.split("-");
              const startTimestamp = +keyParts[keyParts.length - 1];
              const currentTimestamp = getUnixTime(Date.now());
              const millisecondsToStart =
                (startTimestamp - currentTimestamp) * 1000;
              return { session, millisecondsToStart };
            }

            return models.slot
              .findOne({ where: { key: session_key } })
              .then((slot) => {
                if (!slot) return { session: null, millisecondsToStart: null };

                const currentTimestamp = getUnixTime(Date.now());
                const keyParts = session_key.split("-");
                const startTimestamp = +keyParts[keyParts.length - 1];

                const millisecondsToStart =
                  (startTimestamp - currentTimestamp) * 1000;

                if (millisecondsToStart > 0)
                  return { session: null, millisecondsToStart };

                return models.session
                  .create({
                    session_key: currentSessionKey,
                    status: SessionStatus.SCHEDULED,
                    slot_id: slot.id,
                    creator_id: contextValue.decodedProfileData.id,
                    workshop_id: slot.workshop_id,
                    workspace_id: slot.workspace_id,
                  })
                  .then((session) =>
                    startSessionProcess({
                      sessionId: session.id,
                      pubSub: contextValue.pubSub,
                    }).then(() => session)
                  )
                  .then((session) => ({ session, millisecondsToStart }));
              });
          });

        return handler
          .then((result) => {
            if (result.session)
              redisClient
                .del(processingGetSessionKey)
                .then((removed) =>
                  removed > 0 ? publish(result.session) : undefined
                );
            console.log(result);
            return result;
          })
          .catch((error) => {
            force();
            return error;
          });
      });
    }
  ),
};
