import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
} from "sequelize";
import { ConceptualizationModelInstance } from "./conceptualization";
import { ActivityModelInstance } from "./activity";

export interface TheoryAttributes {
  duration: number;
  video: string;
  activity_id: string;
  conceptualization_id: string;

  activity?: ActivityModelInstance;
  conceptualization?: ConceptualizationModelInstance;
}

export interface TheoryCreationAttributes extends TheoryAttributes {}

export interface TheoryInstanceMethods {}

export interface TheoryModelInstance
  extends Model<TheoryAttributes, TheoryCreationAttributes>,
    TheoryAttributes,
    TheoryInstanceMethods {
  getActivity: BelongsToGetAssociationMixin<ActivityModelInstance>;
  setActivity: BelongsToSetAssociationMixin<ActivityModelInstance, string>;

  getConceptualization: BelongsToGetAssociationMixin<ConceptualizationModelInstance>;
  setConceptualization: BelongsToSetAssociationMixin<
    ConceptualizationModelInstance,
    string
  >;
}
