import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
  Optional,
} from "sequelize";
import { ActivityModelInstance } from "./activity";
import { WorkshopModelInstance } from "./workshop";
import { ProfileModelInstance } from "./profile";

export interface AuthorChallengeAttributes {
  id: string;
  profile_id: string;
  workshop_id: string;
  activity_id: string;
  challenge: string;
  create_date: Date;

  profile?: ProfileModelInstance;
  workshop?: WorkshopModelInstance;
  activity?: ActivityModelInstance;
}

export interface AuthorChallengeCreationAttributes
  extends Optional<AuthorChallengeAttributes, "id" | "create_date"> {}

export interface AuthorChallengeInstanceMethods {}

export interface AuthorChallengeModelInstance
  extends Model<AuthorChallengeAttributes, AuthorChallengeCreationAttributes>,
    AuthorChallengeAttributes,
    AuthorChallengeInstanceMethods {
  getWorkshop: BelongsToGetAssociationMixin<WorkshopModelInstance>;
  setWorkshop: BelongsToSetAssociationMixin<WorkshopModelInstance, string>;

  getChallenger: BelongsToGetAssociationMixin<ProfileModelInstance>;
  setChallenger: BelongsToSetAssociationMixin<ProfileModelInstance, string>;

  getActivity: BelongsToGetAssociationMixin<ActivityModelInstance>;
  setActivity: BelongsToSetAssociationMixin<ActivityModelInstance, string>;
}
