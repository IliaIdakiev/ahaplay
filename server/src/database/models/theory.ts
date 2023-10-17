import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize";
import {
  TheoryModelInstance,
  TheoryCreationAttributes,
} from "../interfaces/theory";

export const theoryModel = sequelize.define<
  TheoryModelInstance,
  TheoryCreationAttributes
>(
  "Theory",
  {
    duration: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },
    video: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    activity_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    conceptualization_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "theories",
    timestamps: false,
  }
);
