import { assignmentModel } from "../assignment";
import {
  activityAssociationNames,
  conceptualizationAssociationNames,
} from "../constants";
import { activityModel } from "../activity";
import { conceptualizationModel } from "../conceptualization";

assignmentModel.belongsTo(activityModel, {
  foreignKey: "activity_id",
  as: activityAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
assignmentModel.belongsTo(conceptualizationModel, {
  foreignKey: "conceptualization_id",
  as: conceptualizationAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
