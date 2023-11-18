import { DataTypes } from "sequelize";
import { SlotModelInstance, SlotCreationAttributes } from "../interfaces/slot";
import { baseFields, baseModelConfig } from "./base";
import config from "../../config";
import { sequelize } from "../sequelize-instance";
import { getUnixTime, subMinutes } from "date-fns";

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
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    ...baseModelConfig,
    tableName: "slots",
  }
);

slotModel.prototype.isOpenForSession = function () {
  const openingTime = subMinutes(
    this.schedule_date,
    config.workshop.sessionOpeningTimeInMinutes
  );
  return getUnixTime(openingTime) <= getUnixTime(new Date());
};
