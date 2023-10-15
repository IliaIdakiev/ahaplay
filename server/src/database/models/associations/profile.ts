import { profileModel } from "../profile";
import { workspaceModel } from "../workspace";
import { workshopAssociationNames } from "../constants";

profileModel.hasOne(workspaceModel, {
  foreignKey: "id",
  as: workshopAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
