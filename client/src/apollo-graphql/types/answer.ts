import { Activity } from "./activity";

export interface Answer {
  points: number;
  text: string;
  explanation_text: string;
  activity_id: string;
  activity?: Activity;
}
