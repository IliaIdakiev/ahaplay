import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize-instance";
import {
  MilestoneWorkshopModelInstance,
  MilestoneWorkshopCreationAttributes,
} from "../interfaces/milestone-workshop";
import { baseFields, baseModelConfig } from "./base";

export const milestoneWorkshopModel = sequelize.define<
  MilestoneWorkshopModelInstance,
  MilestoneWorkshopCreationAttributes
>(
  "MilestoneWorkshop",
  {
    ...baseFields,
    milestone_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    workshop_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    ...baseModelConfig,
    tableName: "milestones-workshops",
  }
);
