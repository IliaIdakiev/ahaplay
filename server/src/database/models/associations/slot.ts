import { slotModel } from "../slot";
import { workshopModel } from "../workshop";
import {
  profileAssociationNames,
  sessionAssociationNames,
  workshopAssociationNames,
  workspaceAssociationNames,
} from "../constants";
import { workspaceModel } from "../workspace";
import { profileModel } from "../profile";
import { sessionModel } from "../session";

slotModel.belongsTo(workshopModel, {
  foreignKey: "workshop_id",
  as: workshopAssociationNames.singular,
  onDelete: "CASCADE",
  constraints: false,
});

slotModel.belongsTo(workspaceModel, {
  foreignKey: "workspace_id",
  targetKey: "id",
  as: workspaceAssociationNames.singular,
  onDelete: "CASCADE",
  constraints: false,
});

slotModel.belongsTo(profileModel, {
  foreignKey: "creator_id",
  as: profileAssociationNames.singular,
  onDelete: "CASCADE",
  constraints: false,
});

slotModel.hasOne(sessionModel, {
  foreignKey: "slot_id",
  as: sessionAssociationNames.singular,
  onDelete: "CASCADE",
  constraints: false,
});
