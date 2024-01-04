import { Activity } from "./activity";

export interface Concept {
  name: string;
  text: string;
  sequence_number: number;
  activity_id: string;

  activity?: Activity;
}
