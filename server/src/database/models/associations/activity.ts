import { activityModel } from "../activity";
import { workshopModel } from "../workshop";
import {
  authorChallengeAssociationNames,
  workshopAssociationNames,
  benchmarkAssociationNames,
  conceptualizationAssociationNames,
  questionAssociationNames,
  theoryAssociationNames,
  assignmentAssociationNames,
  answerAssociationNames,
  conceptAssociationNames,
  actionAssociationNames,
  surveyAssociationNames,
} from "../constants";
import { authorChallengeModel } from "../author-challenge";
import { benchmarkModel } from "../benchmark";
import { conceptualizationModel } from "../conceptualization";
import { questionModel } from "../question";
import { theoryModel } from "../theory";
import { assignmentModel } from "../assignment";
import { answerModel } from "../answer";
import { conceptModel } from "../concept";
import { actionModel } from "../action";
import { surveyModel } from "../survey";

activityModel.belongsTo(workshopModel, {
  foreignKey: "workshop_id",
  as: workshopAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});

activityModel.hasOne(authorChallengeModel, {
  sourceKey: "id",
  foreignKey: "activity_id",
  as: authorChallengeAssociationNames.plural,
});

activityModel.hasOne(benchmarkModel, {
  sourceKey: "id",
  foreignKey: "activity_id",
  as: benchmarkAssociationNames.singular,
});

activityModel.hasOne(conceptualizationModel, {
  sourceKey: "id",
  foreignKey: "activity_id",
  as: conceptualizationAssociationNames.singular,
});

activityModel.hasOne(questionModel, {
  sourceKey: "id",
  foreignKey: "activity_id",
  as: questionAssociationNames.singular,
});

activityModel.hasOne(theoryModel, {
  sourceKey: "id",
  foreignKey: "activity_id",
  as: theoryAssociationNames.singular,
});

activityModel.hasOne(assignmentModel, {
  sourceKey: "id",
  foreignKey: "activity_id",
  as: assignmentAssociationNames.singular,
});

activityModel.hasOne(actionModel, {
  sourceKey: "id",
  foreignKey: "activity_id",
  as: actionAssociationNames.singular,
});

activityModel.hasOne(surveyModel, {
  sourceKey: "id",
  foreignKey: "activity_id",
  as: surveyAssociationNames.singular,
});

activityModel.hasMany(answerModel, {
  sourceKey: "id",
  foreignKey: "activity_id",
  as: answerAssociationNames.plural,
});

activityModel.hasMany(conceptModel, {
  sourceKey: "id",
  foreignKey: "activity_id",
  as: conceptAssociationNames.plural,
});
