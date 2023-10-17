import { DataTypes } from "sequelize";
import { SlotModelInstance, SlotCreationAttributes } from "../interfaces/slot";
import { baseFields, baseModelConfig } from "./base";
import { sequelize } from "../sequelize";

export const slotModel = sequelize.define<
  SlotModelInstance,
  SlotCreationAttributes
>(
  "Slot",
  {
    ...baseFields,
    ics: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: "uc_email_domain",
    },
    ics_uid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reminder_status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    schedule_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    creator_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    workshop_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    workspace_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    ...baseModelConfig,
    tableName: "slots",
  }
);
