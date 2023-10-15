import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
  Optional,
} from "sequelize";
import { ActivityType } from "../enums";
import { IBase, IBaseKeys } from "./base";
import { WorkshopModelInstance } from "./workshop";

export interface ActivityAttributes extends IBase {
  description: string;
  sequence_number: number;
  workshop_id: string;
  type: ActivityType;

  workshop?: WorkshopModelInstance;
}

export interface ActivityCreationAttributes
  extends Optional<ActivityAttributes, IBaseKeys> {}

export interface ActivityInstanceMethods {}

export interface ActivityModelInstance
  extends Model<ActivityAttributes, ActivityCreationAttributes>,
    ActivityAttributes,
    ActivityInstanceMethods {
  getWorkshop: BelongsToGetAssociationMixin<WorkshopModelInstance>;
  setWorkshop: BelongsToSetAssociationMixin<WorkshopModelInstance, string>;
}
