import { goalModel } from "../goal";
import { workshopModel } from "../workshop";
import { workshopAssociationNames } from "../constants";

goalModel.belongsTo(workshopModel, {
  foreignKey: "workshop_id",
  as: workshopAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
