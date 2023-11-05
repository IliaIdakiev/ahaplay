import { RedisPubSub } from "graphql-redis-subscriptions";
import { MakeAllKeysRequired } from "../../types";

interface ContextAuthenticatedProfile {
  profileId: string;
  workspaceId: string;
}

export interface AppContext {
  authenticatedProfile?: ContextAuthenticatedProfile;
  pubSub: RedisPubSub;
}

export type AuthenticatedAppContext = MakeAllKeysRequired<AppContext>;
