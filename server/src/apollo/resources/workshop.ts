import gql from "graphql-tag";
import { models } from "../../database";

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
  }
`;

export const workshopQueryDefs = gql`
  type Query {
    workshop(id: String): Workshop!
  }
`;

export const workshopResolvers = {
  workshop(_: undefined, data: { id: string }) {
    return models.workshop.findByPk(data.id);
  },
};
