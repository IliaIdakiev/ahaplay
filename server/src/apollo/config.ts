import gql from "graphql-tag";
import { customTypesResolvers, customTypesTypeDefs } from "./custom-types";
import {
  workshopQueryDefs,
  workshopQueryResolvers,
  workshopTypeDefs,
  activityQueryDefs,
  activityQueryResolvers,
  activityTypeDefs,
} from "./resources";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { extractQueries, extractType, getGqlDefBody } from "./utils";

const queryTypeDef = gql`
  type Query {
    # we must have at least one thing here before we can start extending the Query
    # so we need to leave this one here for the other types we can put the 
    # <entityQueryDefs> inside the array that is provided bellow in mergeTypeDefs 
    # which will simply extend the Query
    ${extractQueries(workshopQueryDefs)}
  }
`;

export const resolvers = {
  ...customTypesResolvers,
  Query: {
    ...workshopQueryResolvers,
    ...activityQueryResolvers,
  },
};

export const typeDefs = mergeTypeDefs([
  queryTypeDef,
  customTypesTypeDefs,
  workshopTypeDefs,
  activityTypeDefs,
  activityQueryDefs,
]);
