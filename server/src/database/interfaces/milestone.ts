import { Model, Optional } from "sequelize";
import { IBase, IBaseKeys } from "./base";

export interface MilestoneAttributes extends IBase {
  name: string;
  description_text: string;
  description_video: string;
  goals: string;
}

export interface MilestoneCreationAttributes
  extends Optional<MilestoneAttributes, IBaseKeys> {}

export interface MilestoneInstanceMethods {}

export interface MilestoneModelInstance
  extends Model<MilestoneAttributes, MilestoneCreationAttributes>,
    MilestoneAttributes,
    MilestoneInstanceMethods {}
