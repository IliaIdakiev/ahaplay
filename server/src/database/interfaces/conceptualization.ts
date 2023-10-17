import {
  Model,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
} from "sequelize";
import { ActivityModelInstance } from "./activity";

export interface ConceptualizationAttributes {
  g_duration: number;
  i_duration: number;
  instructions: string;
  activity_id: string;
  concept: string;
}

export interface ConceptualizationCreationAttributes
  extends ConceptualizationAttributes {}

export interface ConceptualizationInstanceMethods {}

export interface ConceptualizationModelInstance
  extends Model<
      ConceptualizationAttributes,
      ConceptualizationCreationAttributes
    >,
    ConceptualizationAttributes,
    ConceptualizationInstanceMethods {
  getActivity: BelongsToGetAssociationMixin<ActivityModelInstance>;
  setActivity: BelongsToSetAssociationMixin<ActivityModelInstance, string>;
}
