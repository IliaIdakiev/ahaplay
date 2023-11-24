import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize-instance";
import {
  ConceptualizationModelInstance,
  ConceptualizationCreationAttributes,
} from "../interfaces/conceptualization";

export const conceptualizationModel = sequelize.define<
  ConceptualizationModelInstance,
  ConceptualizationCreationAttributes
>(
  "Conceptualization",
  {
    g_duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    i_duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    instructions: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    activity_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    concept: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "conceptualizations",
    timestamps: false,
  }
);
