import { actionModel } from "../action";
import { activityModel } from "../activity";
import { activityAssociationNames } from "../constants";

actionModel.belongsTo(activityModel, {
  foreignKey: "activity_id",
  as: activityAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
