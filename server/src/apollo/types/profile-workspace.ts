import {
  ProfileWorkspaceAccess,
  ProfileWorkspaceStatus,
  WorkspaceAttributes,
  WorkspaceModelInstance,
} from "../../database";

export interface ProfileWorkspace {
  workspace_id: string;
  profile_id: string;
  access: ProfileWorkspaceAccess;
  status: ProfileWorkspaceStatus;
  title: string;
  workspace?: WorkspaceAttributes | WorkspaceModelInstance;
}
