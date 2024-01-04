import { Profile } from "./profile";

export interface LoginResult {
  login: {
    profile: Profile;
    token: string;
  };
}
