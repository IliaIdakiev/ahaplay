import gql from "graphql-tag";
import { customTypesResolvers, customTypesTypeDefs } from "./custom-types";
import {
  workshopQueryDefs,
  workshopResolvers,
  workshopTypeDefs,
} from "./resources";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { extractQueries } from "./utils";

const queryTypeDef = gql`
  type WorkshopQuery {
    ${extractQueries(workshopQueryDefs)}
  }

  type Query {
    workshop: WorkshopQuery
  }
`;

export const resolvers = {
  ...customTypesResolvers,
  Query: {
    workshop: () => ({}),
  },
  WorkshopQuery: {
    ...workshopResolvers,
  },
};

export const typeDefs = mergeTypeDefs([
  queryTypeDef,
  customTypesTypeDefs,
  workshopTypeDefs,
]);
