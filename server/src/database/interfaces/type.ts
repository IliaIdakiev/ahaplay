import {
  Optional,
  Model,
  HasOneGetAssociationMixin,
  HasOneSetAssociationMixin,
} from "sequelize";
import { IBase, IBaseKeys } from "./base";
import { InstructionModelInstance } from "./instruction";

export interface TypeAttributes extends IBase {
  name: string;
  description: string;
  video: string;

  instructions?: InstructionModelInstance[];
}

export interface TypeCreationAttributes
  extends Optional<TypeAttributes, IBaseKeys> {}

export interface TypeInstanceMethods {}

export interface TypeModelInstance
  extends Model<TypeAttributes, TypeCreationAttributes>,
    TypeAttributes,
    TypeInstanceMethods {
  getInstructions: HasOneGetAssociationMixin<InstructionModelInstance>;
  setInstructions: HasOneSetAssociationMixin<InstructionModelInstance, string>;
}
