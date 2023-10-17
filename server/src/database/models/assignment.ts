import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize";
import {
  AssignmentModelInstance,
  AssignmentCreationAttributes,
} from "../interfaces/assignment";

export const assignmentModel = sequelize.define<
  AssignmentModelInstance,
  AssignmentCreationAttributes
>(
  "Assignment",
  {
    duration: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    video: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    activity_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    conceptualization_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "assignments",
    timestamps: false,
  }
);
