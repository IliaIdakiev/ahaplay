import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize";
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
      type: DataTypes.STRING,
      allowNull: false,
    },
    g_duration: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },
    i_duration: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },
    activity_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    assignment_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    theory_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "questions",
    timestamps: false,
  }
);