import {
  activityAssociationNames,
  answerAssociationNames,
  assignmentAssociationNames,
  benchmarkAssociationNames,
  conceptAssociationNames,
  conceptualizationAssociationNames,
  goalAssociationNames,
  instructionAssociationNames,
  models,
  questionAssociationNames,
  theoryAssociationNames,
  typeAssociationNames,
  workshopAssociationNames,
} from "../database";

export function getSessionWithWorkshopActivitiesAndRelations(
  sessionId: string
) {
  return models.session.findByPk(sessionId, {
    include: [
      {
        model: models.workshop,
        as: workshopAssociationNames.singular,
        include: [
          {
            model: models.goal,
            as: goalAssociationNames.plural,
          },
          {
            model: models.type,
            as: typeAssociationNames.singular,
            include: [
              {
                model: models.instruction,
                as: instructionAssociationNames.plural,
              },
            ],
          },
          {
            model: models.activity,
            as: activityAssociationNames.plural,
            include: [
              {
                model: models.question,
                as: questionAssociationNames.singular,
              },
              {
                model: models.answer,
                as: answerAssociationNames.plural,
              },
              {
                model: models.benchmark,
                as: benchmarkAssociationNames.singular,
              },
              {
                model: models.conceptualization,
                as: conceptualizationAssociationNames.singular,
              },
              {
                model: models.concept,
                as: conceptAssociationNames.plural,
              },
              {
                model: models.theory,
                as: theoryAssociationNames.singular,
              },
              {
                model: models.assignment,
                as: assignmentAssociationNames.singular,
              },
            ],
          },
        ],
      },
    ],
  });
}
