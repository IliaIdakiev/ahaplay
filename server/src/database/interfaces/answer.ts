import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
  Optional,
} from "sequelize";
import { IBase, IBaseKeys } from "./base";
import { ActivityModelInstance } from "./activity";

export interface AnswerAttributes extends IBase {
  points: number;
  text: string;
  explanation_text: string;
  activity_id: string;

  activity?: ActivityModelInstance;
}

export interface AnswerCreationAttributes
  extends Optional<AnswerAttributes, IBaseKeys> {}

export interface AnswerInstanceMethods {}

export interface AnswerModelInstance
  extends Model<AnswerAttributes, AnswerCreationAttributes>,
    AnswerAttributes,
    AnswerInstanceMethods {
  getActivity: BelongsToGetAssociationMixin<ActivityModelInstance>;
  setActivity: BelongsToSetAssociationMixin<ActivityModelInstance, string>;
}
