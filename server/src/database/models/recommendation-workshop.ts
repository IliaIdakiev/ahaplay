import { DataTypes } from "sequelize";
import {
  RecommendationWorkshopModelInstance,
  RecommendationWorkshopCreationAttributes,
} from "../interfaces/recommendation-workshop";
import { baseFields, baseModelConfig } from "./base";
import { sequelize } from "../sequelize-instance";

export const recommendationWorkshopModel = sequelize.define<
  RecommendationWorkshopModelInstance,
  RecommendationWorkshopCreationAttributes
>(
  "RecommendationWorkshop",
  {
    ...baseFields,
    recommendation_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    workshop_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    ...baseModelConfig,
    tableName: "recommendations-workshops",
  }
);
