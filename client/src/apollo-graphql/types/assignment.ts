import { Activity } from "./activity";
import { Conceptualization } from "./conceptualization";

export interface Assignment {
  duration: number;
  text: string;
  video: string;
  activity_id: string;
  conceptualization_id: string;

  activity?: Activity;
  conceptualization?: Conceptualization;
}
