import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize-instance";
import {
  QuestionModelInstance,
  QuestionCreationAttributes,
} from "../interfaces/question";

export const questionModel = sequelize.define<
  QuestionModelInstance,
  QuestionCreationAttributes
>(
  "Question",
  {
    text: {
      type: DataTypes.STRING(65535),
      allowNull: false,
    },
    g_duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    i_duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    activity_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    assignment_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    theory_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "questions",
    timestamps: false,
  }
);
