import { Includeable } from "sequelize";
import {
  models,
  workspaceAssociationNames,
  workshopAssociationNames,
  slotAssociationNames,
  profileAssociationNames,
  SessionStatus,
  SlotType,
} from "../../../database";
import { getRequestedFields } from "../../utils";
import { AppContext } from "../../types";
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
    contextValue: any,
    info: any
  ) {
    const include = prepareIncludesFromInfo(info);
    return models.activity.findAll({ where: { ...data }, include });
  },

  joinSession(
    _: undefined,
    data: { slotId: string },
    contextValue: AppContext,
    info: any
  ) {
    const { slotId } = data;
    const include = prepareIncludesFromInfo(info);
    return models.session
      .findOne({ where: { slot_id: slotId } })
      .then((session) => {
        if (session) {
          return session;
        }
        return models.slot.findByPk(slotId).then((slot) => {
          if (!slot || !slot.isOpenForSession()) {
            return null;
          }
          return models.session
            .create({
              session_key: "remove_session_key_maybe", // TODO: ask ???
              completed_activities: 0,
              status:
                slot.type === SlotType.ALL
                  ? SessionStatus.INSTANT
                  : SessionStatus.SCHEDULED,
              slot_id: slot.id,
              creator_id: contextValue.authenticatedProfile!.profileId,
              workshop_id: slot.workshop_id,
              workspace_id: slot.workspace_id,
            })
            .then((session) =>
              Promise.all([
                startSessionProcess({
                  sessionId: session.id,
                  pubSub: contextValue.pubSub,
                }),
                include.length
                  ? models.session.findByPk(session.id, { include })
                  : session,
              ])
            )
            .then(([, session]) => session);
        });
      });
  },
};
