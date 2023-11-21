import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize-instance";
import {
  ActionModelInstance,
  ActionCreationAttributes,
} from "../interfaces/action";

export const actionModel = sequelize.define<
  ActionModelInstance,
  ActionCreationAttributes
>(
  "Action",
  {
    g_duration: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },
    i_duration: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    activity_id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
  },
  {
    tableName: "actions",
    timestamps: false,
  }
);
