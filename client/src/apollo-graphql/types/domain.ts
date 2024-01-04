import { Workspace } from "./workspace";

export interface Domain {
  id: string;
  create_date: Date;
  update_date: Date;
  domain: string;
  workspace_id: string;
  workspace?: Workspace;
}
