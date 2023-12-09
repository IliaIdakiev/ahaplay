import {
  Optional,
  Model,
  HasManyGetAssociationsMixin,
  HasManySetAssociationsMixin,
} from "sequelize";
import { IBase, IBaseKeys } from "./base";
import { ProfileModelInstance } from "./profile";
import { DomainModelInstance } from "./domain";
import { WorkspaceProfileModelInstance } from "./workspace-profile";

export interface WorkspaceAttributes extends IBase {
  image: string;
  name: string;

  workspaceProfiles?: WorkspaceProfileModelInstance[];
  profiles?: ProfileModelInstance[];
  domains?: DomainModelInstance[];
}

export interface WorkspaceCreationAttributes
  extends Optional<WorkspaceAttributes, IBaseKeys | "image"> {}

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
