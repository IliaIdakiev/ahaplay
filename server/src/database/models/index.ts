import "./associations";
import { profileModel } from "./profile";
import { workshopModel } from "./workshop";
import { workspaceModel } from "./workspace";
import { activityModel } from "./activity";
import { authorChallengeModel } from "./author-challenge";
import { registrationModel } from "./registration";

export const models = {
  profile: profileModel,
  workshop: workshopModel,
  workspace: workspaceModel,
  activity: activityModel,
  authorChallenge: authorChallengeModel,
  registration: registrationModel,
};
