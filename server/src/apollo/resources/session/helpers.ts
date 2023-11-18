import { RedisPubSub } from "graphql-redis-subscriptions";
import { SubscriptionAction, SessionStateGraphQL } from "../../types";
import { SessionMachineContext } from "../../../session-processor/+xstate";

export function graphqlInMemorySessionStateSerializer({
  context,
  stateValue,
}: {
  context: SessionMachineContext;
  stateValue: string;
}): SessionStateGraphQL {
  const { activityResult, lastUpdatedTimestamp, ...others } = context;
  const graphQLActivityResult = Object.entries(activityResult).map(
    ([key, value]) => ({
      key,
      value: Object.entries(value).map(([key, value]) => ({ key, value })),
    })
  );

  return {
    context: {
      ...others,
      activityResult: graphQLActivityResult,
      lastUpdatedTimestamp: lastUpdatedTimestamp!,
    },
    value: stateValue,
  };
}

export function generateSessionUpdateSubscriptionEvent(config: {
  sessionId: string;
}) {
  return `${SubscriptionAction.IN_MEMORY_SESSION_UPDATE}::${config.sessionId}`;
}

export function generateSessionKey(config: { slotId: string }) {
  // TODO: Improve this because I'm not sure what exactly it should be
  return config.slotId;
}

export function generateSessionRedisKey(config: { sessionId: string }) {
  return `sessionId:${config.sessionId}::session`;
}

export function publishSessionState(config: {
  sessionId: string;
  pubSub: RedisPubSub;
  sessionStateGraphQL: SessionStateGraphQL;
}) {
  const { sessionId, pubSub, sessionStateGraphQL } = config;
  const eventName = generateSessionUpdateSubscriptionEvent({
    sessionId,
  });

  pubSub.publish(eventName, {
    sessionState: sessionStateGraphQL,
  });
  return sessionStateGraphQL;
}
