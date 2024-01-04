import { Activity } from "./activity";

export interface Action {
  g_duration: number;
  i_duration: number;
  text: string;
  activity_id: string;

  activity?: Activity;
}
