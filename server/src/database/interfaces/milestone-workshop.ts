import { Model, Optional } from "sequelize";
import { IBase, IBaseKeys } from "./base";

export interface MilestoneWorkshopAttributes extends IBase {
  milestone_id: string;
  workshop_id: string;
}

export interface MilestoneWorkshopCreationAttributes
  extends Optional<MilestoneWorkshopAttributes, IBaseKeys> {}

export interface MilestoneWorkshopInstanceMethods {}

export interface MilestoneWorkshopModelInstance
  extends Model<
      MilestoneWorkshopAttributes,
      MilestoneWorkshopCreationAttributes
    >,
    MilestoneWorkshopAttributes,
    MilestoneWorkshopInstanceMethods {}
