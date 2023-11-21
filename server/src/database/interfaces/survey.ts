import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
} from "sequelize";
import { ActivityModelInstance } from "./activity";

export interface SurveyAttributes {
  i_duration: number;
  activity_id: string;

  activity?: ActivityModelInstance;
}

export interface SurveyCreationAttributes extends SurveyAttributes {}

export interface SurveyInstanceMethods {}

export interface SurveyModelInstance
  extends Model<SurveyAttributes, SurveyCreationAttributes>,
    SurveyAttributes,
    SurveyInstanceMethods {
  getActivity: BelongsToGetAssociationMixin<ActivityModelInstance>;
  setActivity: BelongsToSetAssociationMixin<ActivityModelInstance, string>;
}
