import {
  Optional,
  Model,
  HasManyGetAssociationsMixin,
  HasManySetAssociationsMixin,
} from "sequelize";
import { IBase, IBaseKeys } from "./base";
import { ProfileModelInstance } from "./profile";

export interface WorkspaceAttributes extends IBase {
  image: string;
  name: string;

  profiles?: ProfileModelInstance[];
}

export interface WorkspaceCreationAttributes
  extends Optional<WorkspaceAttributes, IBaseKeys> {}

export interface WorkspaceInstanceMethods {}

export interface WorkspaceModelInstance
  extends Model<WorkspaceAttributes, WorkspaceCreationAttributes>,
    WorkspaceAttributes,
    WorkspaceInstanceMethods {
  getUsers: HasManyGetAssociationsMixin<ProfileModelInstance>;
  setUsers: HasManySetAssociationsMixin<ProfileModelInstance, string>;
}
