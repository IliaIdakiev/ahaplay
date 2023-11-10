import { ActivityMode } from "../../session-processor/types";
import { GraphQLActivityMap } from "./graphql-activity-map";

export interface InMemoryProfileMetadataGraphQLState {
  sessionId: string;
  activityIds: string[];
  activityMap: GraphQLActivityMap;
  currentProfileActivityId: string | null;
  finished: boolean;
  activityMode: ActivityMode;
  startEmotions: { emotion: number; profileId: string }[];
  endEmotions: { emotion: number; profileId: string }[];
  lastUpdateTimestamp: number | null;
}
