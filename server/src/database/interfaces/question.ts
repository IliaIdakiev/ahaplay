import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
} from "sequelize";
import { ActivityModelInstance } from "./activity";
import { AssignmentModelInstance } from "./assignment";
import { TheoryModelInstance } from "./theory";

export interface QuestionAttributes {
  text: string;
  g_duration: number;
  i_duration: number;
  activity_id: string;
  assignment_id: string;
  theory_id: string;

  activity?: ActivityModelInstance;
  assignment?: AssignmentModelInstance;
  theory?: TheoryModelInstance;
}

export interface QuestionCreationAttributes extends QuestionAttributes {}

export interface QuestionInstanceMethods {}

export interface QuestionModelInstance
  extends Model<QuestionAttributes, QuestionCreationAttributes>,
    QuestionAttributes,
    QuestionInstanceMethods {
  getActivity: BelongsToGetAssociationMixin<ActivityModelInstance>;
  setActivity: BelongsToSetAssociationMixin<ActivityModelInstance, string>;

  getAssignment: BelongsToGetAssociationMixin<AssignmentModelInstance>;
  setAssignment: BelongsToSetAssociationMixin<AssignmentModelInstance, string>;

  getTheory: BelongsToGetAssociationMixin<TheoryModelInstance>;
  setTheory: BelongsToSetAssociationMixin<TheoryModelInstance, string>;
}
