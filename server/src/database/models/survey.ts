import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize-instance";
import {
  SurveyModelInstance,
  SurveyCreationAttributes,
} from "../interfaces/survey";

export const surveyModel = sequelize.define<
  SurveyModelInstance,
  SurveyCreationAttributes
>(
  "Survey",
  {
    i_duration: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },
    activity_id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
  },
  {
    tableName: "surveys",
    timestamps: false,
  }
);
