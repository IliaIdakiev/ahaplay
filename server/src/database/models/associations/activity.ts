import { activityModel } from "../activity";
import { workshopModel } from "../workshop";
import { workshopAssociationNames } from "../constants";

activityModel.belongsTo(workshopModel, {
  foreignKey: "workshop_id",
  as: workshopAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
