import { workspaceProfileModel } from "../workspace-profile";
import { workspaceModel } from "../workspace";
import { profileModel } from "../profile";
import {
  profileAssociationNames,
  workspaceAssociationNames,
} from "../constants";

workspaceProfileModel.belongsTo(workspaceModel, {
  foreignKey: "workspace_id",
  targetKey: "id",
  as: workspaceAssociationNames.singular,
});

workspaceProfileModel.belongsTo(profileModel, {
  foreignKey: "profile_id",
  targetKey: "id",
  as: profileAssociationNames.singular,
});
