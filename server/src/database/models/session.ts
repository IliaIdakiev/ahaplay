import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize-instance";
import {
  SessionModelInstance,
  SessionCreationAttributes,
} from "../interfaces/session";
import { baseFields, baseModelConfig } from "./base";

export const sessionModel = sequelize.define<
  SessionModelInstance,
  SessionCreationAttributes
>(
  "Session",
  {
    ...baseFields,

    complete_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    session_key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    completed_activities: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    team_name: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    team_play_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    team_points: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    total_activities: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    winner_points: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    slot_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    creator_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    workshop_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    workspace_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    ...baseModelConfig,
    tableName: "sessions",
  }
);
