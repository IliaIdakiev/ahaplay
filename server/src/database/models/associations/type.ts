import { instructionAssociationNames } from "../constants";
import { instructionModel } from "../instruction";
import { typeModel } from "../type";

typeModel.hasMany(instructionModel, {
  sourceKey: "id",
  foreignKey: "type_id",
  as: instructionAssociationNames.plural,
});
