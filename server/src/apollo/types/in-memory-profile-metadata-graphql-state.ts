import { ActivityMode, ActivityType } from "../../session-processor/types";
import { GraphQLActivityMap } from "./graphql-activity-map";

export interface InMemoryProfileMetadataGraphQLState {
  sessionId: string;
  activities: { id: string; type: ActivityType }[];
  activityMap: GraphQLActivityMap;
  currentProfileActivityId: string | null;
  finished: boolean;
  activityMode: ActivityMode;
  startEmotions: { emotion: number; profileId: string }[];
  endEmotions: { emotion: number; profileId: string }[];
  lastUpdateTimestamp: number | null;
}
