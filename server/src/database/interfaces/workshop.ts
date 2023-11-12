import {
  Optional,
  Model,
  HasManyGetAssociationsMixin,
  HasManySetAssociationsMixin,
  HasOneGetAssociationMixin,
  HasOneSetAssociationMixin,
} from "sequelize";
import { WorkshopAvailability } from "../enums";
import { IBase, IBaseKeys } from "./base";
import { ActivityModelInstance } from "./activity";
import { TypeModelInstance } from "./type";

export interface WorkshopAttributes extends IBase {
  duration: number;
  topic: string;
  type: string;
  author_id: string;
  headline: string;
  status: WorkshopAvailability;
  about_text: string;
  about_video: string;

  activities?: ActivityModelInstance[];
  typeInstance?: TypeModelInstance;
}

export interface WorkshopCreationAttributes
  extends Optional<WorkshopAttributes, IBaseKeys> {}

export interface WorkshopInstanceMethods {}

export interface WorkshopModelInstance
  extends Model<WorkshopAttributes, WorkshopCreationAttributes>,
    WorkshopAttributes,
    WorkshopInstanceMethods {
  getActivities: HasManyGetAssociationsMixin<ActivityModelInstance>;
  setActivities: HasManySetAssociationsMixin<ActivityModelInstance, string>;

  getTypeInstance: HasOneGetAssociationMixin<TypeModelInstance>;
  setTypeInstance: HasOneSetAssociationMixin<TypeModelInstance, string>;
}
