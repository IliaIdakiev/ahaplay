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
      type: DataTypes.STRING(65535),
      allowNull: true, // TODO: Maybe remove this at some point
    },
    video: {
      type: DataTypes.STRING,
      allowNull: true, // TODO: Maybe remove this at some point
    },
  },
  {
    ...baseModelConfig,
    tableName: "types",
  }
);
