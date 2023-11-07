import { conceptModel } from "../concept";
import { activityModel } from "../activity";
import { activityAssociationNames } from "../constants";

conceptModel.belongsTo(activityModel, {
  foreignKey: "activity_id",
  as: activityAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
