import { GraphQLActivityMap } from "./graphql-activity-map";
import { InMemorySessionStage } from "../../session-processor/+state/types/in-memory-session-stage";

export interface InMemorySessionMetadataGraphQLState {
  participantProfileIds: string[];
  teamName: string | null;
  currentStage: InMemorySessionStage;
  activityIds: string[];
  stages: {
    [InMemorySessionStage.WAITING]: string[];
    [InMemorySessionStage.START_EMOTION_CHECK]: string[];
    [InMemorySessionStage.TEAM_NAME]: string[];
    [InMemorySessionStage.ON_GOING]: string[];
    [InMemorySessionStage.END_EMOTION_CHECK]: string[];
    [InMemorySessionStage.VIEW_RESULTS]: string[];
  };
  activityMap: GraphQLActivityMap;
  currentActivityId: string | null;
  allActivitiesFinished: boolean;
}
