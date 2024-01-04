import { Activity } from "./activity";
import { Conceptualization } from "./conceptualization";

export interface Theory {
  duration: number;
  video: string;
  activity_id: string;
  conceptualization_id: string;

  activity?: Activity;
  conceptualization?: Conceptualization;
}
