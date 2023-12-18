import { DataTypes } from "sequelize";
import {
  RecommendationModelInstance,
  RecommendationCreationAttributes,
} from "../interfaces/recommendation";
import { baseFields, baseModelConfig } from "./base";
import { sequelize } from "../sequelize-instance";

export const recommendationModel = sequelize.define<
  RecommendationModelInstance,
  RecommendationCreationAttributes
>(
  "Recommendation",
  {
    ...baseFields,
    sequence_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    text: {
      type: DataTypes.STRING(1500),
    },
    activity_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    ...baseModelConfig,
    tableName: "recommendations",
  }
);
