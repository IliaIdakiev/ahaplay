import gql from "graphql-tag";
import { models, workshopAssociationNames } from "../../database";
import { getRequestedFields } from "../utils";

export const activityTypeDefs = gql`
  enum ActivityType {
    Question
    Assignment
    Theory
    Conceptualization
    Benchmark
  }

  type Answer {
    id: String!
    create_date: Date!
    update_date: Date!
    text: String!
    explanation_text: String
    points: Int
    activity_id: String
  }

  type Assignment {
    duration: Int
    text: String!
    video: String!
    activity_id: String!
    conceptualization_id: String
  }

  type Benchmark {
    baseline: String!
    g_duration: Int!
    i_duration: Int!
    reference: String!
    activity_id: String!
    conceptualization_id: String!
  }

  type Concept {
    id: String!
    create_date: Date!
    update_date: Date!
    name: String!
    text: String!
    sequence_number: Int!
    activity_id: String
  }

  type Conceptualization {
    g_duration: Int!
    i_duration: Int!
    instructions: String!
    activity_id: String!
    concept: String!
  }

  type Question {
    text: String!
    g_duration: Int!
    i_duration: Int!
    activity_id: String!
    assignment_id: String
    theory_id: String
  }

  type Theory {
    duration: Int!
    video: String!
    activity_id: String!
    conceptualization_id: String
  }

  type Activity {
    description: String
    sequence_number: Int
    workshop_id: String
    type: ActivityType

    workshop: Workshop
    answers: [Answer]
    assignment: Assignment
    benchmark: Benchmark
    concepts: [Concept]
    conceptualization: Conceptualization
    question: Question
    theory: Theory
  }
`;

export const activityQueryDefs = gql`
  extend type Query {
    getActivity(id: String): Activity
  }
`;

export const activityQueryResolvers = {
  getActivity(
    _: undefined,
    data: { id: string },
    contextValue: any,
    info: any
  ) {
    const requestedFields = getRequestedFields(info);
    const includeWorkshop = !!requestedFields.workshop;
    const options = includeWorkshop
      ? {
          include: [
            { model: models.workshop, as: workshopAssociationNames.singular },
          ],
        }
      : undefined;
    return models.activity.findByPk(data.id, options);
  },
};
