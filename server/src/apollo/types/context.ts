import { RedisPubSub } from "graphql-redis-subscriptions";

export interface AppContext {
  authenticatedUser: {
    profileId: string;
    workspaceId: string;
  };

  pubSub: RedisPubSub;
}
