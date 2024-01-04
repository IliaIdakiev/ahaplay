import { ProfileWorkspaceAccess, ProfileWorkspaceStatus } from "./enums";

export interface Profile {
  id: string;
  create_date: Date;
  update_date: Date;
  email: string;
  headline: string;
  image: string;
  is_completed: boolean;
  login_date: Date;
  name: string;
  workspace: {
    access: ProfileWorkspaceAccess;
    profile_id: string;
    status: ProfileWorkspaceStatus;
    title: string;
    workspace_id: string;
  };
}
