import {
  Optional,
  Model,
  HasManyGetAssociationsMixin,
  HasManySetAssociationsMixin,
} from "sequelize";
import { WorkshopAvailability } from "../enums/workshop-availability";
import { IBase, IBaseKeys } from "./base";
import { ActivityModelInstance } from "./activity";

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
}
