import { RedisPubSub } from "graphql-redis-subscriptions";
import { WorkspaceModelInstance } from "../../database";

interface DecodedProfileData {
  profileId: string;
  email: string;
}

export interface AppContext {
  decodedProfileData: DecodedProfileData | null;
  token: string | null;
  pubSub: RedisPubSub;
  origin: string;
}

export type AuthenticatedAppContext = {
  decodedProfileData: DecodedProfileData;
  token: string;
  originWorkspace?: WorkspaceModelInstance | null;
} & AppContext;
