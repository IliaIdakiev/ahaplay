import { instructionsModel } from "../instruction";
import { workshopModel } from "../workshop";
import { workshopAssociationNames } from "../constants";

instructionsModel.belongsTo(workshopModel, {
  foreignKey: "workshop_id",
  as: workshopAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
