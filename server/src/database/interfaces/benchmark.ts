import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
} from "sequelize";
import { ActivityModelInstance } from "./activity";
import { ConceptualizationModelInstance } from "./conceptualization";

export interface BenchmarkAttributes {
  baseline: string;
  g_duration: number;
  i_duration: number;
  reference: string;
  activity_id: string;
  conceptualization_id: string;
}

export interface BenchmarkCreationAttributes extends BenchmarkAttributes {}

export interface BenchmarkInstanceMethods {}

export interface BenchmarkModelInstance
  extends Model<BenchmarkAttributes, BenchmarkCreationAttributes>,
    BenchmarkAttributes,
    BenchmarkInstanceMethods {
  getActivity: BelongsToGetAssociationMixin<ActivityModelInstance>;
  setActivity: BelongsToSetAssociationMixin<ActivityModelInstance, string>;

  getConceptualization: BelongsToGetAssociationMixin<ConceptualizationModelInstance>;
  setConceptualization: BelongsToSetAssociationMixin<
    ConceptualizationModelInstance,
    string
  >;
}
