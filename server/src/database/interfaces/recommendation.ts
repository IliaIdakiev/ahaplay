import { Optional, Model } from "sequelize";
import { IBase, IBaseKeys } from "./base";

export interface RecommendationAttributes extends IBase {
  sequence_number: number;
  text: string;
  activity_id: string;
}

export interface RecommendationCreationAttributes
  extends Optional<RecommendationAttributes, IBaseKeys> {}

export interface RecommendationInstanceMethods {}

export interface RecommendationModelInstance
  extends Model<RecommendationAttributes, RecommendationCreationAttributes>,
    RecommendationAttributes,
    RecommendationInstanceMethods {}
