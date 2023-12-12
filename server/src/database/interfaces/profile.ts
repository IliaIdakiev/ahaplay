import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
  Optional,
} from "sequelize";
import { IBase, IBaseKeys } from "./base";
import { WorkspaceProfileModelInstance } from "./workspace-profile";

export interface ProfileAttributes extends IBase {
  email: string;
  headline: string;
  image: string;
  login_date: Date;
  name: string;
  password: string;
  is_completed: boolean;

  workspaceProfile?: WorkspaceProfileModelInstance;
}

export interface ProfileCreationAttributes
  extends Optional<
    ProfileAttributes,
    IBaseKeys | "login_date" | "headline" | "image"
  > {}

export interface ProfileInstanceMethods {
  authenticate: (password: string) => Promise<boolean>;
}

export interface ProfileModelInstance
  extends Model<ProfileAttributes, ProfileCreationAttributes>,
    ProfileAttributes,
    ProfileInstanceMethods {
  getWorkspaceProfile: BelongsToGetAssociationMixin<WorkspaceProfileModelInstance>;
  setWorkspaceProfile: BelongsToSetAssociationMixin<
    WorkspaceProfileModelInstance,
    string
  >;
}
