import { instructionModel } from "../instruction";
import { workshopModel } from "../workshop";
import { workshopAssociationNames } from "../constants";

instructionModel.belongsTo(workshopModel, {
  foreignKey: "workshop_id",
  as: workshopAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
