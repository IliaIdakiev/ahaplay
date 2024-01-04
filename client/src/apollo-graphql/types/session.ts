import { SessionStatus } from "./enums/session-status";
import { Profile } from "./profile";
import { Slot } from "./slot";
import { Workshop } from "./workshop";
import { Workspace } from "./workspace";

export interface Session {
  id: string;
  create_date: Date;
  update_date: Date;

  complete_date: Date;
  session_key: string;
  completed_activities?: number;
  state: string;
  team_name: string;
  team_play_time: number;
  team_points: number;
  total_activities: number;
  winner_points: number;
  status: SessionStatus;

  slot_id: string;
  creator_id: string;
  workshop_id: string;
  workspace_id: string;

  slot?: Slot;
  profile?: Profile;
  workshop?: Workshop;
  workspace?: Workspace;
}
