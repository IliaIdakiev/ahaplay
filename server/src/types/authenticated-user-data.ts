import { ProfileWorkspace } from "../apollo/types";

export interface AuthenticatedUserData {
  id: string;
  name: string;
  email: string;
  image: string;
  workspaces: ProfileWorkspace[];
}
