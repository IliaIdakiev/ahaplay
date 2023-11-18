import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize-instance";
import {
  AnswerModelInstance,
  AnswerCreationAttributes,
} from "../interfaces/answer";
import { baseFields, baseModelConfig } from "./base";

export const answerModel = sequelize.define<
  AnswerModelInstance,
  AnswerCreationAttributes
>(
  "Answer",
  {
    ...baseFields,
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    explanation_text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    points: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },
    activity_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    ...baseModelConfig,
    tableName: "answers",
  }
);
