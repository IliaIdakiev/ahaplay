import { Activity } from "./activity";

export interface Conceptualization {
  g_duration: number;
  i_duration: number;
  instructions: string;
  activity_id: string;
  concept: string;

  activity?: Activity;
}
