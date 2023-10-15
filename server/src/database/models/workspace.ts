import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize";
import {
  WorkspaceModelInstance,
  WorkspaceCreationAttributes,
} from "../interfaces/workspace";
import { baseFields, baseModelConfig } from "./base";

export const workspaceModel = sequelize.define<
  WorkspaceModelInstance,
  WorkspaceCreationAttributes
>(
  "Workspace",
  {
    ...baseFields,
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    workspace_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    ...baseModelConfig,
    tableName: "workspaces",
  }
);
