import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
  Optional,
} from "sequelize";
import { IBase, IBaseKeys } from "./base";
import { TypeModelInstance } from "./type";

export interface InstructionAttributes extends IBase {
  text: string;
  sequence_number: number;
  type_id: string;

  type?: TypeModelInstance;
}

export interface InstructionCreationAttributes
  extends Optional<InstructionAttributes, IBaseKeys> {}

export interface InstructionInstanceMethods {}

export interface InstructionModelInstance
  extends Model<InstructionAttributes, InstructionCreationAttributes>,
    InstructionAttributes,
    InstructionInstanceMethods {
  getType: BelongsToGetAssociationMixin<TypeModelInstance>;
  setType: BelongsToSetAssociationMixin<TypeModelInstance, string>;
}
