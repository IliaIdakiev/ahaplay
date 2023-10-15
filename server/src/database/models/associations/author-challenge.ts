import { activityModel } from "../activity";
import { authorChallengeModel } from "../author-challenge";
import {
  workshopAssociationNames,
  activityAssociationNames,
  profileAssociationNames,
} from "../constants";
import { profileModel } from "../profile";
import { workshopModel } from "../workshop";

authorChallengeModel.belongsTo(workshopModel, {
  foreignKey: "workshop_id",
  as: workshopAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
authorChallengeModel.belongsTo(activityModel, {
  foreignKey: "activity_id",
  as: activityAssociationNames.singular,
  onDelete: "CASCADE",
  constraints: false,
});
authorChallengeModel.belongsTo(profileModel, {
  foreignKey: "profile_id",
  as: profileAssociationNames.singular,
  onDelete: "CASCADE",
  constraints: false,
});
