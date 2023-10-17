import { conceptualizationModel } from "../conceptualization";
import { activityAssociationNames } from "../constants";
import { activityModel } from "../activity";

conceptualizationModel.belongsTo(activityModel, {
  foreignKey: "activity_id",
  as: activityAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
