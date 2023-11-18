import { DataTypes } from "sequelize";
import { TypeModelInstance, TypeCreationAttributes } from "../interfaces/type";
import { baseFields, baseModelConfig } from "./base";
import { sequelize } from "../sequelize-instance";

export const typeModel = sequelize.define<
  TypeModelInstance,
  TypeCreationAttributes
>(
  "Type",
  {
    ...baseFields,
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    video: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    ...baseModelConfig,
    tableName: "types",
  }
);
