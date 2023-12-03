import {
  Model,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Optional,
} from "sequelize";
import { IBase, IBaseKeys } from "./base";
import { ProfileModelInstance } from "./profile";
import { SlotModelInstance } from "./slot";
import { WorkshopModelInstance } from "./workshop";
import { WorkspaceModelInstance } from "./workspace";
import { SessionStatus } from "../enums";

export interface SessionAttributes extends IBase {
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

  slot?: SlotModelInstance;
  profile?: ProfileModelInstance;
  workshop?: WorkshopModelInstance;
  workspace?: WorkspaceModelInstance;
}
export interface SessionCreationAttributes
  extends Optional<
    SessionAttributes,
    | IBaseKeys
    | "state"
    | "team_name"
    | "team_play_time"
    | "team_points"
    | "completed_activities"
    | "total_activities"
    | "winner_points"
    | "complete_date"
  > {}

export interface SessionInstanceMethods {
  isOpenForSession(): boolean;
}

export interface SessionModelInstance
  extends Model<SessionAttributes, SessionCreationAttributes>,
    SessionAttributes,
    SessionInstanceMethods {
  getSlot: BelongsToGetAssociationMixin<SlotModelInstance>;
  setSlot: BelongsToSetAssociationMixin<SlotModelInstance, string>;

  getProfile: BelongsToGetAssociationMixin<ProfileModelInstance>;
  setProfile: BelongsToSetAssociationMixin<ProfileModelInstance, string>;

  getWorkshop: BelongsToGetAssociationMixin<WorkshopModelInstance>;
  setWorkshop: BelongsToSetAssociationMixin<WorkshopModelInstance, string>;

  getWorkspace: BelongsToGetAssociationMixin<WorkspaceModelInstance>;
  setWorkspace: BelongsToSetAssociationMixin<WorkspaceModelInstance, string>;
}
