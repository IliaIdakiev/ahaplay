import { RedisPubSub } from "graphql-redis-subscriptions";
import { MakeAllKeysRequired } from "../../types";

interface ContextAuthenticatedProfile {
  profileId: string;
  email: string;
}

export interface AppContext {
  authenticatedProfile?: ContextAuthenticatedProfile;
  pubSub: RedisPubSub;
  origin: string;
}

export type AuthenticatedAppContext = MakeAllKeysRequired<AppContext>;
