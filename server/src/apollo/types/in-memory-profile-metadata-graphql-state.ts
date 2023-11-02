import { GraphQLActivityMap } from "./graphql-activity-map";

export interface InMemoryProfileMetadataGraphQLState {
  activityIds: string[];
  activityMap: GraphQLActivityMap;
  currentActivityId: string | null;
  finished: boolean;
}
