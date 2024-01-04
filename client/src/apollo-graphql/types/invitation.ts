import { Profile } from "./profile";
import { Slot } from "./slot";

export interface Invitation {
  email: string;
  emails_count: string;
  profile: Profile;
  profile_id: string;
  slot: Slot;
  slot_id: string;
  status: string;
}
