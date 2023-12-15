import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize-instance";
import {
  InvitationModelInstance,
  InvitationCreationAttributes,
} from "../interfaces/invitation";
import { baseFields, baseModelConfig } from "./base";
import { InvitationStatus } from "../enums";

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
      defaultValue: InvitationStatus.PENDING,
    },
    emails_count: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 0,
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
    indexes: [
      {
        unique: true,
        fields: ["email", "slot_id"],
        name: "unique_constraint_email_slot_id",
      },
    ],
  }
);
