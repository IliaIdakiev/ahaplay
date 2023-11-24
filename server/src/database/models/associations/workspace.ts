import { domainAssociationNames } from "../constants";
import { domainModel } from "../domain";
import { workspaceModel } from "../workspace";

workspaceModel.hasMany(domainModel, {
  sourceKey: "id",
  foreignKey: "workspace_id",
  as: domainAssociationNames.plural,
});
