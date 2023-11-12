import "./associations";
import { profileModel } from "./profile";
import { workshopModel } from "./workshop";
import { workspaceModel } from "./workspace";
import { activityModel } from "./activity";
import { authorChallengeModel } from "./author-challenge";
import { registrationModel } from "./registration";
import { slotModel } from "./slot";
import { assignmentModel } from "./assignment";
import { questionModel } from "./question";
import { benchmarkModel } from "./benchmark";
import { conceptualizationModel } from "./conceptualization";
import { theoryModel } from "./theory";
import { sessionModel } from "./session";
import { conceptModel } from "./concept";
import { answerModel } from "./answer";
import { typeModel } from "./type";
import { instructionModel } from "./instruction";
import { goalModel } from "./goal";

export const models = {
  profile: profileModel,
  workshop: workshopModel,
  workspace: workspaceModel,
  activity: activityModel,
  authorChallenge: authorChallengeModel,
  registration: registrationModel,
  slot: slotModel,
  assignment: assignmentModel,
  question: questionModel,
  answer: answerModel,
  benchmark: benchmarkModel,
  conceptualization: conceptualizationModel,
  theory: theoryModel,
  session: sessionModel,
  concept: conceptModel,
  type: typeModel,
  instruction: instructionModel,
  goal: goalModel,
};
