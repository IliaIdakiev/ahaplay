import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  Model,
  Optional,
} from "sequelize";
import { IBase, IBaseKeys } from "./base";
import { ActivityModelInstance } from "./activity";

export interface ConceptAttributes extends IBase {
  name: string;
  text: string;
  sequence_number: number;
  activity_id: string;

  activity?: ActivityModelInstance;
}

export interface ConceptCreationAttributes
  extends Optional<ConceptAttributes, IBaseKeys> {}

export interface ConceptInstanceMethods {}

export interface ConceptModelInstance
  extends Model<ConceptAttributes, ConceptCreationAttributes>,
    ConceptAttributes,
    ConceptInstanceMethods {
  getActivity: BelongsToGetAssociationMixin<ActivityModelInstance>;
  setActivity: BelongsToSetAssociationMixin<ActivityModelInstance, string>;
}
