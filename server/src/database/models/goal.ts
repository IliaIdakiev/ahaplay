import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize-instance";
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
      type: DataTypes.STRING(65535),
      allowNull: false,
    },
    sequence_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    workshop_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    ...baseModelConfig,
    tableName: "goals",
  }
);
