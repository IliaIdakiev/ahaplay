import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
} from "sequelize";
import { SessionModelInstance } from "./session";
import { ProfileModelInstance } from "./profile";
import { SlotModelInstance } from "./slot";

export interface SessionProfileAttributes {
  session_id: string;
  session_key: string;
  profile_id: string;
  slot_id: string;
}

export interface SessionProfileCreationAttributes
  extends SessionProfileAttributes {}

export interface SessionProfileInstanceMethods {}

export interface SessionProfileModelInstance
  extends Model<SessionProfileAttributes, SessionProfileCreationAttributes>,
    SessionProfileAttributes,
    SessionProfileInstanceMethods {
  getSession: BelongsToGetAssociationMixin<SessionModelInstance>;
  setSession: BelongsToSetAssociationMixin<SessionModelInstance, string>;

  getProfile: BelongsToGetAssociationMixin<ProfileModelInstance>;
  setProfile: BelongsToSetAssociationMixin<ProfileModelInstance, string>;

  getSlot: BelongsToGetAssociationMixin<SlotModelInstance>;
  setSlot: BelongsToSetAssociationMixin<SlotModelInstance, string>;
}
