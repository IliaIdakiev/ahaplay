import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize-instance";
import {
  SessionProfileModelInstance,
  SessionProfileCreationAttributes,
} from "../interfaces/session-profile";

export const sessionProfileModel = sequelize.define<
  SessionProfileModelInstance,
  SessionProfileCreationAttributes
>(
  "SessionProfile",
  {
    session_key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    session_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    profile_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slot_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "session-profile",
    indexes: [
      {
        unique: true,
        fields: ["session_key", "session_id", "profile_id", "slot_id"],
        name: "unique_constraint_session_key_session_id_profile_id_slot_id",
      },
    ],
  }
);
