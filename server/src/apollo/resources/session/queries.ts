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
  getSession(
    _: undefined,
    data: { sessionKey: string },
    contextValue: AuthenticatedAppContext,
    info: any
  ): Promise<{
    session: SessionModelInstance | null;
    millisecondsToStart: number | null;
  }> {
    const { sessionKey } = data;
    return models.session
      .findOne({
        where: { session_key: sessionKey },
      })
      .then((session) => {
        if (session) {
          const currentTimestamp = new Date().getTime();
          const startTimestamp =
            parseInt(session.session_key.slice(0, 8), 16) * 1000;
          const millisecondsToStart = startTimestamp - currentTimestamp;
          return { session, millisecondsToStart };
        }

        return models.slot
          .findOne({ where: { key: sessionKey } })
          .then((slot) => {
            if (!slot) return { session: null, millisecondsToStart: null };

            const currentTimestamp = new Date().getTime();
            const startTimestamp = parseInt(slot.key.slice(0, 8), 16) * 1000;

            const millisecondsToStart = startTimestamp - currentTimestamp;
            if (millisecondsToStart > 0)
              return { session: null, millisecondsToStart };
            return models.session
              .create({
                session_key: sessionKey,
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
                const currentTimestamp = new Date().getTime();
                const startTimestamp =
                  parseInt(slot.key.slice(0, 8), 16) * 1000;

                const millisecondsToStart = startTimestamp - currentTimestamp;
                return { session, millisecondsToStart };
              });
          });
      });
  },
};
