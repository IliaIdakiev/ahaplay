import {
  domainAssociationNames,
  profileAssociationNames,
  workspaceProfileAssociationNames,
} from "../constants";
import { domainModel } from "../domain";
import { profileModel } from "../profile";
import { workspaceModel } from "../workspace";
import { workspaceProfileModel } from "../workspace-profile";

workspaceModel.hasMany(domainModel, {
  sourceKey: "id",
  foreignKey: "workspace_id",
  as: domainAssociationNames.plural,
});

workspaceModel.hasMany(workspaceProfileModel, {
  sourceKey: "id",
  foreignKey: "workspace_id",
  as: workspaceProfileAssociationNames.plural,
});

workspaceModel.belongsToMany(profileModel, {
  sourceKey: "id",
  foreignKey: "workspace_id",
  as: profileAssociationNames.plural,
  through: workspaceProfileModel,
});
