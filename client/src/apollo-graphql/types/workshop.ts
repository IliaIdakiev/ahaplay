import { Activity } from "./activity";

export interface Workshop {
  about_text: string;
  about_video: string;
  create_date: string;
  duration: number;
  headline: string;
  id: string;
  status: string;
  topic: string;
  type: string;
  update_date: Date;

  activities: Activity[];
}
