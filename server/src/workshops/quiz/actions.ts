import { QuizPhase } from "./typings";

export enum ActionTypes {
  SetQuizPhase = "SetQuizPhase",
}

export function setQuizPhase(phase: QuizPhase) {
  return {
    type: ActionTypes.SetQuizPhase,
    phase,
  } as const;
}

export type QuizActions = ReturnType<typeof setQuizPhase>;
