import gql from "graphql-tag";
import { models, workshopAssociationNames } from "../../database";
import { extractRequestedFieldsFromInfo } from "../utils";

export const activityTypeDefs = gql`
  enum ActivityType {
    Question
    Assignment
    Theory
    Conceptualization
    Benchmark
  }

  type Activity {
    description: String
    sequence_number: Int
    workshop_id: String
    type: ActivityType

    workshop: Workshop
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
    const requestedFields = extractRequestedFieldsFromInfo(info);
    const includeWorkshop = requestedFields.includes("workshop");
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
