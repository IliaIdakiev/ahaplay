import { Model, Optional } from "sequelize";
import { IBase, IBaseKeys } from "./base";

export interface RegistrationAttributes extends IBase {
  email: string;
  secret: string;
}

export interface RegistrationCreationAttributes
  extends Optional<RegistrationAttributes, IBaseKeys> {}

export interface RegistrationInstanceMethods {}

export interface RegistrationModelInstance
  extends Model<RegistrationAttributes, RegistrationCreationAttributes>,
    RegistrationAttributes,
    RegistrationInstanceMethods {}
