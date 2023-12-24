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
      const { pubSub } = contextValue;

      process.nextTick(() => {
        redisClient.set(`processing_get_session:${session_key}`, "yes");
      });

      return redisClient
        .get(`processing_get_session:${session_key}`)
        .then((isCurrentSlotBeingProcessed) => {
          if (isCurrentSlotBeingProcessed !== "yes") return;
          return new Promise<string>((res, rej) => {
            let subscriptionId: number;
            pubSub
              .subscribe(
                `processing_get_session_for_key:${session_key}`,
                (value) => {
                  res(value);
                  pubSub.unsubscribe(subscriptionId);
                }
              )
              .then((id) => (subscriptionId = id))
              .catch((err) => rej(err));
          });
        })
        .then(() =>
          models.session
            .findOne({
              where: { session_key },
            })
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
                  if (!slot)
                    return { session: null, millisecondsToStart: null };

                  const currentTimestamp = getUnixTime(Date.now());
                  const keyParts = session_key.split("-");
                  const startTimestamp = +keyParts[keyParts.length - 1];

                  const millisecondsToStart =
                    (startTimestamp - currentTimestamp) * 1000;

                  if (millisecondsToStart > 0)
                    return { session: null, millisecondsToStart };

                  return models.session
                    .create({
                      session_key: session_key,
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
                    .then((session) => {
                      pubSub.publish(
                        `processing_get_session_for_key:${session_key}`,
                        session.id
                      );
                      redisClient.del(`processing_get_session:${session_key}`);
                      return { session, millisecondsToStart };
                    });
                });
            })
        );
    }
  ),
};
