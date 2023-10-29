import { InMemorySessionStage } from "./in-memory-session-stage";

export interface InMemorySessionMetadata {
  stage: InMemorySessionStage;
  sessionId: string;
  lastUpdateTimestamp: number;
  teamName: string | null;
  state: string;
  profileIds: string[];
  activeProfileIds: string[];
  connectedProfileIds: string[];
}
