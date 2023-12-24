import { RedisPubSub } from "graphql-redis-subscriptions";
const pubSub = new RedisPubSub();
const _subscribe = pubSub.subscribe;
const _publish = pubSub.publish;

pubSub.subscribe = function (...data) {
  return _subscribe.apply(this, data as any);
};

pubSub.publish = function (...data) {
  return _publish.apply(this, data);
};

export { pubSub };
