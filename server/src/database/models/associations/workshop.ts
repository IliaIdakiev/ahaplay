import { activityAssociationNames } from "../constants";
import { workshopModel } from "../workshop";
import { activityModel } from "../activity";

workshopModel.hasMany(activityModel, {
  sourceKey: "id",
  foreignKey: "workshop_id",
  as: activityAssociationNames.plural,
});
