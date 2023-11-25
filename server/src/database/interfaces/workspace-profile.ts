import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
  Optional,
} from "sequelize";
import { ProfileWorkspaceAccess, ProfileWorkspaceStatus } from "../enums";
import { IBase, IBaseKeys } from "./base";
import { ProfileModelInstance } from "./profile";
import { WorkspaceModelInstance } from "./workspace";

export interface WorkspaceProfileAttributes extends IBase {
  profile_id: string;
  workspace_id: string;
  access: ProfileWorkspaceAccess;
  status: ProfileWorkspaceStatus;
  title: string;

  workspace?: WorkspaceModelInstance;
  profile?: ProfileModelInstance;
}

export interface WorkspaceProfileCreationAttributes
  extends Optional<WorkspaceProfileAttributes, IBaseKeys> {}

export interface WorkspaceProfileInstanceMethods {}

export interface WorkspaceProfileModelInstance
  extends Model<WorkspaceProfileAttributes, WorkspaceProfileCreationAttributes>,
    WorkspaceProfileAttributes,
    WorkspaceProfileInstanceMethods {
  getProfile: BelongsToGetAssociationMixin<ProfileModelInstance>;
  setProfile: BelongsToSetAssociationMixin<ProfileModelInstance, string>;

  getWorkspace: BelongsToGetAssociationMixin<WorkspaceModelInstance>;
  setWorkspace: BelongsToSetAssociationMixin<WorkspaceModelInstance, string>;
}
