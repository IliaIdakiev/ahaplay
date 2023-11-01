import { InMemorySessionStage } from "../../../../redis/types";

export function getNextStage(currentStage: InMemorySessionStage) {
  if (currentStage === InMemorySessionStage.WAITING) {
    return InMemorySessionStage.START_EMOTION_CHECK;
  }
  if (currentStage === InMemorySessionStage.START_EMOTION_CHECK) {
    return InMemorySessionStage.TEAM_NAME;
  }
  if (currentStage === InMemorySessionStage.TEAM_NAME) {
    return InMemorySessionStage.ON_GOING;
  }
  if (currentStage === InMemorySessionStage.ON_GOING) {
    return InMemorySessionStage.END_EMOTION_CHECK;
  }
  return InMemorySessionStage.VIEW_RESULTS;
}
