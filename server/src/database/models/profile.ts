import { DataTypes } from "sequelize";
import {
  ProfileModelInstance,
  ProfileCreationAttributes,
} from "../interfaces/profile";
import { baseFields, baseModelConfig } from "./base";
import { sequelize } from "../sequelize-instance";
import { hashPassword } from "../utils";
import { compare } from "bcrypt";

export const profileModel = sequelize.define<
  ProfileModelInstance,
  ProfileCreationAttributes
>(
  "Profile",
  {
    ...baseFields,
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: "uc_email_domain",
    },
    headline: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    login_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    ...baseModelConfig,
    tableName: "profiles",
    hooks: {
      beforeSave(instance, options) {
        if (instance.previous("password") === instance.password) {
          return;
        }
        return hashPassword(instance.password).then((result) => {
          if (result) {
            instance.password = result.hash;
          }
        });
      },
    },
  }
);

profileModel.prototype.authenticate = function (password: string) {
  if (!this.password) {
    return Promise.resolve(false);
  }
  return compare(password, this.password);
};
