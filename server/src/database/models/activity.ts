import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize";
import {
  ActivityModelInstance,
  ActivityCreationAttributes,
} from "../interfaces/activity";
import { baseFields, baseModelConfig } from "./base";

export const activityModel = sequelize.define<
  ActivityModelInstance,
  ActivityCreationAttributes
>(
  "Activity",
  {
    ...baseFields,
    description: {
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
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    ...baseModelConfig,
    tableName: "activities",
  }
);

activityModel.prototype.getGroupDuration = function () {};

activityModel.prototype.getProfileDuration = function () {};
