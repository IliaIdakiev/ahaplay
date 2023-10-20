import gql from "graphql-tag";
import { activityAssociationNames, models } from "../../database";
import { extractRequestedFieldsFromInfo } from "../utils";

export const workshopTypeDefs = gql`
  enum WorkshopAvailability {
    AVAILABLE
    UNAVAILABLE
  }

  type Workshop {
    id: String
    duration: Int
    topic: String
    type: String
    author_id: String
    headline: String
    status: WorkshopAvailability
    about_text: String
    about_video: String
    create_date: Date
    update_date: Date

    activities: [Activity]
  }
`;

export const workshopQueryDefs = gql`
  extend type Query {
    workshop(id: String!): Workshop
  }
`;

export const workshopQueryResolvers = {
  workshop(_: undefined, data: { id: string }, contextValue: any, info: any) {
    const requestedFields = extractRequestedFieldsFromInfo(info);
    const includeActivities = requestedFields.includes("activities");
    const options = includeActivities
      ? {
          include: [
            { model: models.activity, as: activityAssociationNames.plural },
          ],
        }
      : undefined;

    return models.workshop.findByPk(data.id, options);
  },
};
