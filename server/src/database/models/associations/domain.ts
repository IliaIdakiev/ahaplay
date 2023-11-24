import { domainModel } from "../domain";
import { workspaceModel } from "../workspace";
import { workspaceAssociationNames } from "../constants";

domainModel.belongsTo(workspaceModel, {
  foreignKey: "workspace_id",
  as: workspaceAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
