import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
  Optional,
} from "sequelize";
import { IBase, IBaseKeys } from "./base";
import { WorkshopModelInstance } from "./workshop";

export interface InstructionAttributes extends IBase {
  text: string;
  sequence_number: number;
  workshop_id: string;

  workshop?: WorkshopModelInstance;
}

export interface InstructionCreationAttributes
  extends Optional<InstructionAttributes, IBaseKeys> {}

export interface InstructionInstanceMethods {}

export interface InstructionModelInstance
  extends Model<InstructionAttributes, InstructionCreationAttributes>,
    InstructionAttributes,
    InstructionInstanceMethods {
  getWorkshop: BelongsToGetAssociationMixin<WorkshopModelInstance>;
  setWorkshop: BelongsToSetAssociationMixin<WorkshopModelInstance, string>;
}
