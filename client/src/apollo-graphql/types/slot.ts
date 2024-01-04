import { Workshop } from "./workshop";

export interface Slot {
  ics: string;
  ics_uid: string;
  key: string;
  reminder_status: string;
  schedule_date: Date;
  status: string;
  type: string;
  workshop_id: string;
  workspace_id: string;
  workspace: {
    create_date: Date;
    id: string;
    image: string;
    name: string;
    update_date: Date;
    workspace_key: string;
  };
  workshop: Workshop;
}
