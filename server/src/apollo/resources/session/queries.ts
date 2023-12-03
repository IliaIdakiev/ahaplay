import { Includeable } from "sequelize";
import {
  models,
  workspaceAssociationNames,
  workshopAssociationNames,
  slotAssociationNames,
  profileAssociationNames,
} from "../../../database";
import { getRequestedFields } from "../../utils";

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
};
