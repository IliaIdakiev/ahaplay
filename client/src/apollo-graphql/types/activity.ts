import { Action } from "./action";
import { Answer } from "./answer";
import { Assignment } from "./assignment";
import { Benchmark } from "./benchmark";
import { Concept } from "./concept";
import { Conceptualization } from "./conceptualization";
import { Question } from "./question";
import { Survey } from "./survey";
import { Theory } from "./theory";

export interface Activity {
  id: string;
  create_date: Date;
  update_date: Date;
  description: string;
  sequence_number: string;
  workshop_id: string;
  type: string;

  answers?: Answer[];
  benchmark?: Benchmark;
  assignment?: Assignment;
  concept?: Concept;
  conceptualization?: Conceptualization;
  question?: Question;
  theory?: Theory;
  survey?: Survey;
  action?: Action;
}
