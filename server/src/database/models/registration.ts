import { DataTypes } from "sequelize";
import {
  RegistrationModelInstance,
  RegistrationCreationAttributes,
} from "../interfaces/registration";
import { baseFields, baseModelConfig } from "./base";
import { sequelize } from "../sequelize-instance";

export const registrationModel = sequelize.define<
  RegistrationModelInstance,
  RegistrationCreationAttributes
>(
  "Registration",
  {
    ...baseFields,
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: "uc_email_domain",
    },
    secret: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    ...baseModelConfig,
    tableName: "registrations",
  }
);
