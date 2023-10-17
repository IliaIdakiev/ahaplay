import { legacy_createStore as createStore } from "redux";
import { QuizPhase } from "./typings";
import { ActionTypes, QuizActions } from "./actions";
import { ActivityType, WorkshopModelInstance } from "src/database";

export interface QuizSessionState {
  readonly phase: QuizPhase;
  readonly workshop: WorkshopModelInstance;
  readonly personalQuestionAnswers: any;
  readonly groupQuestionAnswers: any;
}

export interface QuizProfileState {}

export function createNewQuizSessionStore(workshop: WorkshopModelInstance) {
  const activities = workshop.activities!;
  const questionActivities = activities.filter(
    (a) => a.type == ActivityType.Question
  );

  const initialState: QuizSessionState = {
    phase: QuizPhase.Invitation,
    workshop,
    personalQuestionAnswers: {},
    groupQuestionAnswers: {},
  };

  const reducer = (
    state: QuizSessionState = initialState,
    action: QuizActions
  ): QuizSessionState => {
    switch (action.type) {
      case ActionTypes.SetQuizPhase: {
        return { ...state, phase: action.phase };
      }
      default:
        return state;
    }
  };

  return createStore(reducer);
}

export function createNewProfileQuizStore(workshop: WorkshopModelInstance) {
  const initialState: QuizProfileState = {};

  const reducer = (
    state: QuizProfileState = initialState,
    action: QuizActions
  ): QuizProfileState => {
    switch (action.type) {
      default:
        return state;
    }
  };

  return createStore(reducer);
}
