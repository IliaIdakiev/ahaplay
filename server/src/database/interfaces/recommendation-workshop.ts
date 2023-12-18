import { Optional, Model } from "sequelize";
import { IBase, IBaseKeys } from "./base";

export interface RecommendationWorkshopAttributes extends IBase {
  recommendation_id: string;
  workshop_id: string;
  weight: number;
}

export interface RecommendationWorkshopCreationAttributes
  extends Optional<RecommendationWorkshopAttributes, IBaseKeys> {}

export interface RecommendationWorkshopInstanceMethods {}

export interface RecommendationWorkshopModelInstance
  extends Model<
      RecommendationWorkshopAttributes,
      RecommendationWorkshopCreationAttributes
    >,
    RecommendationWorkshopAttributes,
    RecommendationWorkshopInstanceMethods {}
