import { sessionModel } from "../session";
import {
  profileAssociationNames,
  slotAssociationNames,
  workshopAssociationNames,
  workspaceAssociationNames,
} from "../constants";
import { slotModel } from "../slot";
import { profileModel } from "../profile";
import { workshopModel } from "../workshop";
import { workspaceModel } from "../workspace";

sessionModel.belongsTo(slotModel, {
  foreignKey: "slot_id",
  as: slotAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
sessionModel.belongsTo(profileModel, {
  foreignKey: "creator_id",
  as: profileAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
sessionModel.belongsTo(workshopModel, {
  foreignKey: "workshop_id",
  as: workshopAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
sessionModel.belongsTo(workspaceModel, {
  foreignKey: "workspace_id",
  targetKey: "id",
  as: workspaceAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
