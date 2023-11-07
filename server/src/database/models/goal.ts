import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize";
import { GoalModelInstance, GoalCreationAttributes } from "../interfaces/goal";
import { baseFields, baseModelConfig } from "./base";

export const goalModel = sequelize.define<
  GoalModelInstance,
  GoalCreationAttributes
>(
  "Goal",
  {
    ...baseFields,
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sequence_number: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },
    workshop_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    ...baseModelConfig,
    tableName: "goals",
  }
);
