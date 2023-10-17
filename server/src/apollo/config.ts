import gql from "graphql-tag";
import { customTypesResolvers, customTypesTypeDefs } from "./custom-types";
import {
  workshopQueryDefs,
  workshopResolvers,
  workshopTypeDefs,
  activityQueryDefs,
  activityResolvers,
  activityTypeDefs,
} from "./resources";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { extractQueries } from "./utils";

const queryTypeDef = gql`
  type WorkshopQuery {
    ${extractQueries(workshopQueryDefs)}
  }
  type ActivityQuery {
    ${extractQueries(activityQueryDefs)}
  }

  type Query {
    workshop: WorkshopQuery
    activity: ActivityQuery
  }
`;

export const resolvers = {
  ...customTypesResolvers,
  Query: {
    workshop: () => ({}),
    activity: () => ({}),
  },
  WorkshopQuery: {
    ...workshopResolvers,
  },
  ActivityQuery: {
    ...activityResolvers,
  },
};

export const typeDefs = mergeTypeDefs([
  queryTypeDef,
  customTypesTypeDefs,
  workshopTypeDefs,
  activityTypeDefs,
]);
