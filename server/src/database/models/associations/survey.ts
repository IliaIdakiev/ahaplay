import { surveyModel } from "../survey";
import { activityModel } from "../activity";
import { activityAssociationNames } from "../constants";

surveyModel.belongsTo(activityModel, {
  foreignKey: "activity_id",
  as: activityAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
