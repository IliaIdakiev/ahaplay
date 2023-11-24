import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize-instance";
import {
  InvitationModelInstance,
  InvitationCreationAttributes,
} from "../interfaces/invitation";
import { baseFields, baseModelConfig } from "./base";

export const invitationModel = sequelize.define<
  InvitationModelInstance,
  InvitationCreationAttributes
>(
  "Invitation",
  {
    ...baseFields,
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    emails_count: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    profile_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    slot_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    ...baseModelConfig,
    tableName: "invitations",
  }
);
