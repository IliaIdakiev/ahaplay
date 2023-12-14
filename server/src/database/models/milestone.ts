import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize-instance";
import {
  MilestoneModelInstance,
  MilestoneCreationAttributes,
} from "../interfaces/milestone";
import { baseFields, baseModelConfig } from "./base";

export const milestoneModel = sequelize.define<
  MilestoneModelInstance,
  MilestoneCreationAttributes
>(
  "Milestone",
  {
    ...baseFields,
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description_text: {
      type: DataTypes.STRING(65535),
      allowNull: false,
    },
    description_video: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    goals: {
      type: DataTypes.STRING(65535),
    },
  },
  {
    ...baseModelConfig,
    tableName: "milestones",
  }
);
