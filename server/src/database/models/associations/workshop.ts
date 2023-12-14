import {
  activityAssociationNames,
  goalAssociationNames,
  typeAssociationNames,
} from "../constants";
import { workspaceProfileAssociationNames } from "../constants";
import { profileModel } from "../profile";
import { workshopModel } from "../workshop";
import { activityModel } from "../activity";
import { typeModel } from "../type";
import { goalModel } from "../goal";

workshopModel.hasMany(activityModel, {
  sourceKey: "id",
  foreignKey: "workshop_id",
  as: activityAssociationNames.plural,
});

workshopModel.belongsTo(typeModel, {
  targetKey: "id",
  foreignKey: "type",
  as: typeAssociationNames.singular,
});

workshopModel.hasMany(goalModel, {
  sourceKey: "id",
  foreignKey: "workshop_id",
  as: goalAssociationNames.plural,
});

workshopModel.belongsTo(profileModel, {
  targetKey: "id",
  foreignKey: "author_id",
  as: workspaceProfileAssociationNames.singular,
});
