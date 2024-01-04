import { Activity } from "./activity";

export interface Survey {
  i_duration: number;
  activity_id: string;

  activity?: Activity;
}
