import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
  Optional,
} from "sequelize";
import { IBase, IBaseKeys } from "./base";
import { ProfileModelInstance } from "./profile";
import { SlotModelInstance } from "./slot";
import { InvitationStatus } from "../enums";

export interface InvitationAttributes extends IBase {
  email: string;
  emails_count: number;
  status: InvitationStatus;

  profile_id: string;
  slot_id: string;

  profile?: ProfileModelInstance;
  slot?: SlotModelInstance;
}

export interface InvitationCreationAttributes
  extends Optional<
    InvitationAttributes,
    IBaseKeys | "status" | "emails_count"
  > {}

export interface InvitationInstanceMethods {}

export interface InvitationModelInstance
  extends Model<InvitationAttributes, InvitationCreationAttributes>,
    InvitationAttributes,
    InvitationInstanceMethods {
  getProfile: BelongsToGetAssociationMixin<ProfileModelInstance>;
  setProfile: BelongsToSetAssociationMixin<ProfileModelInstance, string>;

  getSlot: BelongsToGetAssociationMixin<SlotModelInstance>;
  setSlot: BelongsToSetAssociationMixin<SlotModelInstance, string>;
}
