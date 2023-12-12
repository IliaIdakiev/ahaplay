import { workspaceProfileAssociationNames } from "../constants";
import { profileModel } from "../profile";
import { workspaceProfileModel } from "../workspace-profile";

profileModel.hasOne(workspaceProfileModel, {
  sourceKey: "id",
  foreignKey: "profile_id",
  as: workspaceProfileAssociationNames.singular,
});
