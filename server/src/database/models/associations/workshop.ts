import { activityAssociationNames, typeAssociationNames } from "../constants";
import { workshopModel } from "../workshop";
import { activityModel } from "../activity";
import { typeModel } from "../type";

workshopModel.hasMany(activityModel, {
  sourceKey: "id",
  foreignKey: "workshop_id",
  as: activityAssociationNames.plural,
});

workshopModel.hasOne(typeModel, {
  sourceKey: "type",
  foreignKey: "id",
  as: typeAssociationNames.singular,
});
