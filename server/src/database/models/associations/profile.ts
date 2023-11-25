import { workspaceAssociationNames } from "../constants";
import { profileModel } from "../profile";
import { workspaceModel } from "../workspace";
import { workspaceProfileModel } from "../workspace-profile";

profileModel.belongsToMany(workspaceModel, {
  sourceKey: "id",
  foreignKey: "profile_id",
  as: workspaceAssociationNames.plural,
  through: workspaceProfileModel,
});
