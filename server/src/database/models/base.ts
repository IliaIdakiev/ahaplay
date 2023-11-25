import { DataTypes, Sequelize } from "sequelize";
import { v4 } from "uuid";

export const baseFields = {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    unique: true,
    defaultValue: () => v4(),
  },
  create_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
  },
  update_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
  },
};

export const baseModelConfig = {
  timestamps: true,
  createdAt: "create_date",
  updatedAt: "update_date",
};
