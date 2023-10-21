import gql from "graphql-tag";
import { customTypesResolvers, customTypesTypeDefs } from "./custom-types";
import {
  workshopQueryDefs,
  workshopQueryResolvers,
  workshopTypeDefs,
  activityQueryDefs,
  activityQueryResolvers,
  activityTypeDefs,
  sessionSubscriptionResolvers,
  sessionSubscriptionDefs,
  sessionTypeDefs,
} from "./resources";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { extractQuery, extractSubscription } from "./utils";

const queryTypeDef = gql`
  type Query {
    # we must have at least one thing here before we can start extending the Query
    # so we need to leave this one here for the other types we can put the 
    # <entityQueryDefs> inside the array that is provided bellow in mergeTypeDefs 
    # which will simply extend the Query
    ${extractQuery(workshopQueryDefs)}
  }
  type Subscription {
    # we must have at least one thing here before we can start extending the Subscription
    # so we need to leave this one here for the other types we can put the 
    # <entitySubscriptionDefs> inside the array that is provided bellow in mergeTypeDefs 
    # which will simply extend the Subscription
    ${extractSubscription(sessionSubscriptionDefs)}
  }
`;

export const resolvers = {
  ...customTypesResolvers,
  Query: {
    ...workshopQueryResolvers,
    ...activityQueryResolvers,
  },
  Subscription: {
    ...sessionSubscriptionResolvers,
  },
};

export const typeDefs = mergeTypeDefs([
  queryTypeDef,
  customTypesTypeDefs,
  workshopTypeDefs,
  activityTypeDefs,
  activityQueryDefs,
  sessionTypeDefs,
]);
