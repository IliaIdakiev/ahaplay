import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
  Optional,
} from "sequelize";
import { IBase, IBaseKeys } from "./base";
import { WorkshopModelInstance } from "./workshop";

export interface GoalAttributes extends IBase {
  text: string;
  sequence_number: number;
  workshop_id: string;

  workshop?: WorkshopModelInstance;
}

export interface GoalCreationAttributes
  extends Optional<GoalAttributes, IBaseKeys> {}

export interface GoalInstanceMethods {}

export interface GoalModelInstance
  extends Model<GoalAttributes, GoalCreationAttributes>,
    GoalAttributes,
    GoalInstanceMethods {
  getWorkshop: BelongsToGetAssociationMixin<WorkshopModelInstance>;
  setWorkshop: BelongsToSetAssociationMixin<WorkshopModelInstance, string>;
}
