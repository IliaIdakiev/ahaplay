import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize";
import {
  WorkshopModelInstance,
  WorkshopCreationAttributes,
} from "../interfaces/workshop";
import { baseFields, baseModelConfig } from "./base";

export const workshopModel = sequelize.define<
  WorkshopModelInstance,
  WorkshopCreationAttributes
>(
  "Workshop",
  {
    ...baseFields,
    duration: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
    topic: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    author_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    headline: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    about_text: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    about_video: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    ...baseModelConfig,
    tableName: "workshops",
  }
);
