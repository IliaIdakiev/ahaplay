import {
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  HasManyGetAssociationsMixin,
  HasManySetAssociationsMixin,
  HasOneGetAssociationMixin,
  HasOneSetAssociationMixin,
  Model,
  Optional,
} from "sequelize";
import { ActivityType } from "../enums";
import { IBase, IBaseKeys } from "./base";
import { WorkshopModelInstance } from "./workshop";
import { AuthorChallengeModelInstance } from "./author-challenge";
import { BenchmarkModelInstance } from "./benchmark";
import { AnswerModelInstance } from "./answer";
import { AssignmentModelInstance } from "./assignment";
import { ConceptModelInstance } from "./concept";
import { ConceptualizationModelInstance } from "./conceptualization";
import { QuestionModelInstance } from "./question";
import { TheoryModelInstance } from "./theory";
import { SurveyModelInstance } from "./survey";
import { ActionModelInstance } from "./action";

export interface ActivityAttributes extends IBase {
  description: string;
  sequence_number: number;
  workshop_id: string;
  type: ActivityType;

  workshop?: WorkshopModelInstance;
  authorChallenges?: AuthorChallengeModelInstance[];
  answers?: AnswerModelInstance[];

  benchmark?: BenchmarkModelInstance;
  assignment?: AssignmentModelInstance;
  concept?: ConceptModelInstance;
  conceptualization?: ConceptualizationModelInstance;
  question?: QuestionModelInstance;
  theory?: TheoryModelInstance;
  survey?: SurveyModelInstance;
  action?: ActionModelInstance;
}

export interface ActivityCreationAttributes
  extends Optional<ActivityAttributes, IBaseKeys> {}

export interface ActivityInstanceMethods {
  isTheory: () => boolean;
  isAssignment: () => boolean;
  isQuestion: () => boolean;
  isBenchmark: () => boolean;
  isConceptualization: () => boolean;
  isConcept: () => boolean;
  getGroupDuration: () => number | null;
  getIndividualDuration: () => number | null;
  getDuration: () => number | null;
}

export interface ActivityModelInstance
  extends Model<ActivityAttributes, ActivityCreationAttributes>,
    ActivityAttributes,
    ActivityInstanceMethods {
  getWorkshop: BelongsToGetAssociationMixin<WorkshopModelInstance>;
  setWorkshop: BelongsToSetAssociationMixin<WorkshopModelInstance, string>;

  getAuthorChallenges: HasManyGetAssociationsMixin<AuthorChallengeModelInstance>;
  setAuthorChallenges: HasManySetAssociationsMixin<
    AuthorChallengeModelInstance,
    string
  >;

  getBenchmark: HasOneGetAssociationMixin<BenchmarkModelInstance>;
  setBenchmark: HasOneSetAssociationMixin<BenchmarkModelInstance, string>;

  getAnswers: HasManyGetAssociationsMixin<AnswerModelInstance>;
  setAnswers: HasManySetAssociationsMixin<AnswerModelInstance, string>;

  getAssignment: HasOneGetAssociationMixin<AssignmentModelInstance>;
  setAssignment: HasOneSetAssociationMixin<AssignmentModelInstance, string>;

  getConcept: HasOneGetAssociationMixin<ConceptModelInstance>;
  setConcept: HasOneSetAssociationMixin<ConceptModelInstance, string>;

  getConceptualization: HasOneGetAssociationMixin<ConceptualizationModelInstance>;
  setConceptualization: HasOneSetAssociationMixin<
    ConceptualizationModelInstance,
    string
  >;

  getQuestion: HasOneGetAssociationMixin<QuestionModelInstance>;
  setQuestion: HasOneSetAssociationMixin<QuestionModelInstance, string>;

  getTheory: HasOneGetAssociationMixin<TheoryModelInstance>;
  setTheory: HasOneSetAssociationMixin<TheoryModelInstance, string>;

  getSurvey: HasOneGetAssociationMixin<SurveyModelInstance>;
  setSurvey: HasOneSetAssociationMixin<SurveyModelInstance, string>;

  getAction: HasOneGetAssociationMixin<ActionModelInstance>;
  setAction: HasOneSetAssociationMixin<ActionModelInstance, string>;
}
