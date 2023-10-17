import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
} from "sequelize";
import { ActivityModelInstance } from "./activity";
import { ConceptualizationModelInstance } from "./conceptualization";

export interface AssignmentAttributes {
  duration: number;
  text: string;
  video: string;

  activity_id: string;
  conceptualization_id: string;

  activity?: ActivityModelInstance;
  conceptualization?: ConceptualizationModelInstance;
}

export interface AssignmentCreationAttributes extends AssignmentAttributes {}

export interface AssignmentInstanceMethods {}

export interface AssignmentModelInstance
  extends Model<AssignmentAttributes, AssignmentCreationAttributes>,
    AssignmentAttributes,
    AssignmentInstanceMethods {
  getActivity: BelongsToGetAssociationMixin<ActivityModelInstance>;
  setActivity: BelongsToSetAssociationMixin<ActivityModelInstance, string>;

  getConceptualization: BelongsToGetAssociationMixin<ConceptualizationModelInstance>;
  setConceptualization: BelongsToSetAssociationMixin<
    ConceptualizationModelInstance,
    string
  >;
}
