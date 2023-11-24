import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
  Optional,
} from "sequelize";
import { IBase, IBaseKeys } from "./base";
import { WorkspaceModelInstance } from "./workspace";

export interface DomainAttributes extends IBase {
  domain: string;
  workspace_id: string;
  workspace?: WorkspaceModelInstance;
}

export interface DomainCreationAttributes
  extends Optional<DomainAttributes, IBaseKeys> {}

export interface DomainInstanceMethods {}

export interface DomainModelInstance
  extends Model<DomainAttributes, DomainCreationAttributes>,
    DomainAttributes,
    DomainInstanceMethods {
  getWorkspace: BelongsToGetAssociationMixin<WorkspaceModelInstance>;
  setWorkspace: BelongsToSetAssociationMixin<WorkspaceModelInstance, string>;
}
