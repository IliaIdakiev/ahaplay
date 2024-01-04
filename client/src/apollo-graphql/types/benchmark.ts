import { Activity } from "./activity";
import { Conceptualization } from "./conceptualization";

export interface Benchmark {
  baseline: string;
  g_duration: number;
  i_duration: number;
  reference: string;
  activity_id: string;
  conceptualization_id: string;

  activity?: Activity;
  conceptualization?: Conceptualization;
}
