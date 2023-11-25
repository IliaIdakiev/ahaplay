import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize-instance";
import {
  WorkspaceProfileModelInstance,
  WorkspaceProfileCreationAttributes,
} from "../interfaces/workspace-profile";
import { baseFields, baseModelConfig } from "./base";

export const workspaceProfileModel = sequelize.define<
  WorkspaceProfileModelInstance,
  WorkspaceProfileCreationAttributes
>(
  "WorkspaceProfile",
  {
    ...baseFields,
    profile_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    workspace_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    access: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    ...baseModelConfig,
    tableName: "workspace-profile",
  }
);
