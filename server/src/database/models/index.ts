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
import { actionModel } from "./action";
import { surveyModel } from "./survey";
import { invitationModel } from "./invitation";
import { domainModel } from "./domain";
import { workspaceProfileModel } from "./workspace-profile";
import { milestoneModel } from "./milestone";
import { milestoneWorkshopModel } from "./milestone-workshop";
import { recommendationModel } from "./recommendation";
import { recommendationWorkshopModel } from "./recommendation-workshop";

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
  action: actionModel,
  survey: surveyModel,
  invitation: invitationModel,
  domain: domainModel,
  workspaceProfile: workspaceProfileModel,
  milestone: milestoneModel,
  milestoneWorkshop: milestoneWorkshopModel,
  recommendation: recommendationModel,
  recommendationWorkshop: recommendationWorkshopModel,
};
