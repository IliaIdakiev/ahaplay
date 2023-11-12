import { answerModel } from "../answer";
import { activityModel } from "../activity";
import { activityAssociationNames } from "../constants";

answerModel.belongsTo(activityModel, {
  foreignKey: "activity_id",
  as: activityAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
