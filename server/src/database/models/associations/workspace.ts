import { profileAssociationNames } from "../constants";
import { profileModel } from "../profile";
import { workspaceModel } from "../workspace";

workspaceModel.hasMany(profileModel, {
  sourceKey: "id",
  foreignKey: "active_workspace_id",
  as: profileAssociationNames.singular,
});
