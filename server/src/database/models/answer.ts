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
      type: DataTypes.STRING(1500),
      allowNull: false,
    },
    explanation_text: {
      type: DataTypes.STRING(65535),
      allowNull: true,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    activity_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    ...baseModelConfig,
    tableName: "answers",
  }
);
