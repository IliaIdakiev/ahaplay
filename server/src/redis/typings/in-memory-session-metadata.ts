import { InMemorySessionStage } from "./in-memory-session-stage";

export interface InMemorySessionMetadata {
  stage: InMemorySessionStage;
  sessionId: string;
  lastUpdateTimestamp: number;
}
