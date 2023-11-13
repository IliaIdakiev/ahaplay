import { GraphQLActivityMap } from "./graphql-activity-map";
import { InMemorySessionStage } from "../../session-processor/+state/types/in-memory-session-stage";
import { ActivityMode } from "../../session-processor/types";
import { ActivityType } from "../../database";

export interface InMemorySessionMetadataGraphQLState {
  sessionId: string;
  profileIds: string[];
  participantProfileIds: string[];
  connectedProfileIds: string[];
  teamName: string | null;
  currentStage: InMemorySessionStage;
  activities: { id: string; type: ActivityType }[];
  activityMode: ActivityMode;
  stages: {
    [InMemorySessionStage.WAITING]: string[];
    [InMemorySessionStage.START_EMOTION_CHECK]: string[];
    [InMemorySessionStage.TEAM_NAME]: string[];
    [InMemorySessionStage.ON_GOING]: string[];
    [InMemorySessionStage.END_EMOTION_CHECK]: string[];
    [InMemorySessionStage.VIEW_RESULTS]: string[];
  };
  activityMap: GraphQLActivityMap;
  currentGroupActivityId: string | null;
  allActivitiesFinished: boolean;
  lastUpdateTimestamp: number | null;
}
