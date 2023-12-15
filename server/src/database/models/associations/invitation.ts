import { profileAssociationNames, slotAssociationNames } from "../constants";
import { invitationModel } from "../invitation";
import { profileModel } from "../profile";
import { slotModel } from "../slot";

invitationModel.belongsTo(profileModel, {
  foreignKey: "profile_id",
  as: profileAssociationNames.singular,
  onDelete: "CASCADE",
  constraints: false,
});

invitationModel.belongsTo(slotModel, {
  foreignKey: "slot_id",
  as: slotAssociationNames.singular,
  onDelete: "CASCADE",
  constraints: false,
});
