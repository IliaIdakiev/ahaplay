import { RedisPubSub } from "graphql-redis-subscriptions";
import { AuthJwtPayload } from "../../types";

export interface AppContext {
  decodedProfileData: AuthJwtPayload | null;
  token: string | null;
  pubSub: RedisPubSub;
  origin: string;
}

export type AuthenticatedAppContext = {
  decodedProfileData: AuthJwtPayload;
  token: string;
  isMaster: boolean;
} & AppContext;
