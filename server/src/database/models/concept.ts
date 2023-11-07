import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize";
import {
  ConceptModelInstance,
  ConceptCreationAttributes,
} from "../interfaces/concept";
import { baseFields, baseModelConfig } from "./base";

export const conceptModel = sequelize.define<
  ConceptModelInstance,
  ConceptCreationAttributes
>(
  "Concept",
  {
    ...baseFields,
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sequence_number: {
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
    tableName: "concepts",
  }
);
