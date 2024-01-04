import { Domain } from "domain";
import { Profile } from "./profile";
import { WorkspaceProfile } from "./workspace-profile";

export interface Workspace {
  id: string;
  create_date: Date;
  update_date: Date;

  image: string;
  name: string;

  workspaceProfiles?: WorkspaceProfile[];
  profiles?: Profile[];
  domains?: Domain[];
}
