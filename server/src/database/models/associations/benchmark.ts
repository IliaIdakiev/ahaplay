import { benchmarkModel } from "../benchmark";
import {
  activityAssociationNames,
  conceptualizationAssociationNames,
} from "../constants";
import { activityModel } from "../activity";
import { conceptualizationModel } from "../conceptualization";

benchmarkModel.belongsTo(activityModel, {
  foreignKey: "activity_id",
  as: activityAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
benchmarkModel.belongsTo(conceptualizationModel, {
  foreignKey: "conceptualization_id",
  as: conceptualizationAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
