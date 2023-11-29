import gql from "graphql-tag";
import { customTypesResolvers, customTypesTypeDefs } from "./custom-types";
import {
  workshopQueryDefs,
  workshopQueryResolvers,
  workshopTypeDefs,
  activityQueryDefs,
  activityQueryResolvers,
  activityTypeDefs,
  subscriptionResolvers,
  sessionTypeDefs,
  sessionSubscriptionDefs,
  sessionQueryDefs,
  sessionMutationResolvers,
  sessionMutationDefs,
  slotQueryResolvers,
  slotQueryDefs,
  slotTypeDefs,
  profileQueryDefs,
  profileQueryResolvers,
  profileTypeDefs,
  workspaceQueryResolvers,
  workspaceTypeDefs,
  invitationQueryDefs,
  invitationTypeDefs,
  invitationQueryResolvers,
  workspaceQueryDefs,
  workspaceMutationDefs,
  workspaceMutationResolvers,
  profileMutationResolvers,
  profileMutationDefs,
  slotMutationResolvers,
  slotMutationDefs,
} from "./resources";

import { mergeTypeDefs } from "@graphql-tools/merge";
import { extractMutation, extractQuery, extractSubscription } from "./utils";

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
  
  type Mutation {
    # we must have at least one thing here before we can start extending the Mutation
    # so we need to leave this one here for the other types we can put the 
    # <entityMutationDefs> inside the array that is provided bellow in mergeTypeDefs 
    # which will simply extend the Mutation
    ${extractMutation(sessionMutationDefs)}
  }
`;

export const resolvers = {
  ...customTypesResolvers,
  Query: {
    ...workshopQueryResolvers,
    ...activityQueryResolvers,
    ...slotQueryResolvers,
    ...profileQueryResolvers,
    ...workspaceQueryResolvers,
    ...invitationQueryResolvers,
  },
  Subscription: {
    ...subscriptionResolvers,
  },
  Mutation: {
    ...sessionMutationResolvers,
    ...workspaceMutationResolvers,
    ...profileMutationResolvers,
    ...slotMutationResolvers,
  },
};

export const typeDefs = mergeTypeDefs([
  queryTypeDef,
  customTypesTypeDefs,
  workshopTypeDefs,
  activityTypeDefs,
  activityQueryDefs,
  sessionTypeDefs,
  slotTypeDefs,
  slotQueryDefs,
  profileTypeDefs,
  profileQueryDefs,
  workspaceTypeDefs,
  workspaceQueryDefs,
  workshopQueryDefs,
  invitationTypeDefs,
  invitationQueryDefs,
  sessionQueryDefs,
  workspaceMutationDefs,
  profileMutationDefs,
  slotMutationDefs,
]);
