// WARNING: Changing those values might result in broken workshops
// (check in-memory-metadata.ts graphql schema)
export enum InMemorySessionStage {
  WAITING = "WAITING",
  START_EMOTION_CHECK = "START_EMOTION_CHECK",
  TEAM_NAME = "TEAM_NAME",
  ON_GOING = "ON_GOING",
  END_EMOTION_CHECK = "END_EMOTION_CHECK",
  VIEW_RESULTS = "VIEW_RESULTS",
}