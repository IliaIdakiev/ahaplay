import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize-instance";
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
      type: DataTypes.STRING(65535),
      allowNull: false,
    },
    sequence_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    activity_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    ...baseModelConfig,
    tableName: "concepts",
  }
);
