import { theoryModel } from "../theory";
import {
  workshopAssociationNames,
  assignmentAssociationNames,
} from "../constants";
import { conceptualizationModel } from "../conceptualization";
import { activityModel } from "../activity";

theoryModel.belongsTo(activityModel, {
  foreignKey: "activity_id",
  as: workshopAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
theoryModel.belongsTo(conceptualizationModel, {
  foreignKey: "conceptualization_id",
  as: assignmentAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
