import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
} from "sequelize";
import { ActivityModelInstance } from "./activity";

export interface ActionAttributes {
  g_duration: number;
  i_duration: number;
  text: string;
  activity_id: string;

  activity?: ActivityModelInstance;
}

export interface ActionCreationAttributes extends ActionAttributes {}

export interface ActionInstanceMethods {}

export interface ActionModelInstance
  extends Model<ActionAttributes, ActionCreationAttributes>,
    ActionAttributes,
    ActionInstanceMethods {
  getActivity: BelongsToGetAssociationMixin<ActivityModelInstance>;
  setActivity: BelongsToSetAssociationMixin<ActivityModelInstance, string>;
}
