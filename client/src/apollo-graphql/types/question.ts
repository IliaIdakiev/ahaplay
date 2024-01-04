import { Activity } from "./activity";
import { Assignment } from "./assignment";
import { Theory } from "./theory";

export interface Question {
  text: string;
  g_duration: number;
  i_duration: number;
  activity_id: string;
  assignment_id: string;
  theory_id: string;

  activity?: Activity;
  assignment?: Assignment;
  theory?: Theory;
}
