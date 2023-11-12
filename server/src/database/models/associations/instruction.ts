import { typeAssociationNames } from "../constants";
import { instructionModel } from "../instruction";
import { typeModel } from "../type";

instructionModel.belongsTo(typeModel, {
  foreignKey: "type_id",
  as: typeAssociationNames.singular,
  onDelete: "SET NULL",
  constraints: false,
});
