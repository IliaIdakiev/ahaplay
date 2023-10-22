import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
  Optional,
} from "sequelize";
import { IBase, IBaseKeys } from "./base";
import { WorkspaceModelInstance } from "./workspace";
import { WorkshopModelInstance } from "./workshop";
import { ProfileModelInstance } from "./profile";
import { SlotStatus, SlotType } from "../enums";

export interface SlotAttributes extends IBase {
  ics: string; // TODO: Ask?
  ics_uid: string; // TODO: Ask?
  key: string;
  reminder_status: string;
  schedule_date: Date;
  status: SlotStatus;
  creator_id: string;
  workshop_id: string;
  workspace_id: string;
  type: SlotType;

  workspace?: WorkspaceModelInstance;
  workshop?: WorkshopModelInstance;
  profile?: ProfileModelInstance;
}

export interface SlotCreationAttributes
  extends Optional<SlotAttributes, IBaseKeys> {}

export interface SlotInstanceMethods {
  isOpenForSession(): boolean;
}

export interface SlotModelInstance
  extends Model<SlotAttributes, SlotCreationAttributes>,
    SlotAttributes,
    SlotInstanceMethods {
  getWorkspace: BelongsToGetAssociationMixin<WorkspaceModelInstance>;
  setWorkspace: BelongsToSetAssociationMixin<WorkspaceModelInstance, string>;

  getWorkshop: BelongsToGetAssociationMixin<WorkshopModelInstance>;
  setWorkshop: BelongsToSetAssociationMixin<WorkshopModelInstance, string>;

  getProfile: BelongsToGetAssociationMixin<ProfileModelInstance>;
  setProfile: BelongsToSetAssociationMixin<ProfileModelInstance, string>;
}
