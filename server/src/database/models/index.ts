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
  benchmark: benchmarkModel,
  conceptualization: conceptualizationModel,
  theory: theoryModel,
};
