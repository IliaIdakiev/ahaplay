import { activityModel } from "../activity";
import { workshopModel } from "../workshop";
import {
  authorChallengeAssociationNames,
  workshopAssociationNames,
  benchmarkAssociationNames,
  conceptualizationAssociationNames,
  questionAssociationNames,
  theoryAssociationNames,
} from "../constants";
import { authorChallengeModel } from "../author-challenge";
import { benchmarkModel } from "../benchmark";
import { conceptualizationModel } from "../conceptualization";
import { questionModel } from "../question";
import { theoryModel } from "../theory";

activityModel.belongsTo(workshopModel, {
  foreignKey: "workshop_id",
  as: workshopAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});

activityModel.hasMany(authorChallengeModel, {
  sourceKey: "id",
  foreignKey: "activity_id",
  as: authorChallengeAssociationNames.plural,
});

activityModel.hasMany(benchmarkModel, {
  sourceKey: "id",
  foreignKey: "activity_id",
  as: benchmarkAssociationNames.plural,
});

activityModel.hasMany(conceptualizationModel, {
  sourceKey: "id",
  foreignKey: "activity_id",
  as: conceptualizationAssociationNames.plural,
});

activityModel.hasMany(questionModel, {
  sourceKey: "id",
  foreignKey: "activity_id",
  as: questionAssociationNames.plural,
});

activityModel.hasMany(theoryModel, {
  sourceKey: "id",
  foreignKey: "activity_id",
  as: theoryAssociationNames.plural,
});
