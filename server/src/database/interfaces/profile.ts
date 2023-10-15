import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
  Optional,
} from "sequelize";
import { IBase, IBaseKeys } from "./base";
import { WorkspaceModelInstance } from "./workspace";

export interface ProfileAttributes extends IBase {
  email: string;
  headline: string;
  image: string;
  login_date: Date;
  name: string;
  password: string;
  is_completed: boolean;
  active_workspace_id: string;

  workspace?: WorkspaceModelInstance;
}

export interface ProfileCreationAttributes
  extends Optional<ProfileAttributes, IBaseKeys | "login_date"> {}

export interface ProfileInstanceMethods {
  authenticate: (password: string) => Promise<boolean>;
}

export interface ProfileModelInstance
  extends Model<ProfileAttributes, ProfileCreationAttributes>,
    ProfileAttributes,
    ProfileInstanceMethods {
  getWorkspace: BelongsToGetAssociationMixin<WorkspaceModelInstance>;
  setWorkspace: BelongsToSetAssociationMixin<WorkspaceModelInstance, string>;
}
