import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize-instance";
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
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    text: {
      type: DataTypes.STRING(4096),
      allowNull: false,
    },
    video: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    activity_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    conceptualization_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "assignments",
    timestamps: false,
  }
);
