import {
  Optional,
  Model,
  HasManyGetAssociationsMixin,
  HasManySetAssociationsMixin,
} from "sequelize";
import { IBase, IBaseKeys } from "./base";
import { ProfileModelInstance } from "./profile";
import { DomainModelInstance } from "./domain";

export interface WorkspaceAttributes extends IBase {
  image: string;
  name: string;

  profiles?: ProfileModelInstance[];
  domains?: DomainModelInstance[];
}

export interface WorkspaceCreationAttributes
  extends Optional<WorkspaceAttributes, IBaseKeys> {}

export interface WorkspaceInstanceMethods {}

export interface WorkspaceModelInstance
  extends Model<WorkspaceAttributes, WorkspaceCreationAttributes>,
    WorkspaceAttributes,
    WorkspaceInstanceMethods {
  getProfiles: HasManyGetAssociationsMixin<ProfileModelInstance>;
  setProfiles: HasManySetAssociationsMixin<ProfileModelInstance, string>;

  getDomains: HasManyGetAssociationsMixin<DomainModelInstance>;
  setDomains: HasManySetAssociationsMixin<DomainModelInstance, string>;
}
