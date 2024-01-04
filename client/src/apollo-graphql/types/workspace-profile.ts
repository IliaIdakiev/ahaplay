import { ProfileWorkspaceAccess, ProfileWorkspaceStatus } from "./enums";
import { Profile } from "./profile";
import { Workspace } from "./workspace";

export interface WorkspaceProfile {
  profile_id: string;
  workspace_id: string;
  access: ProfileWorkspaceAccess;
  status: ProfileWorkspaceStatus;
  title: string;

  workspace?: Workspace;
  profile?: Profile;
}
