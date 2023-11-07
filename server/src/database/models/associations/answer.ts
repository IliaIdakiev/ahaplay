import { goalModel } from "../goal";
import { activityModel } from "../activity";
import { activityAssociationNames } from "../constants";

goalModel.belongsTo(activityModel, {
  foreignKey: "activity_id",
  as: activityAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
