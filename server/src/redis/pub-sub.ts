import { RedisPubSub } from "graphql-redis-subscriptions";
const pubSub = new RedisPubSub();
const _subscribe = pubSub.subscribe;
const _publish = pubSub.publish;

pubSub.subscribe = function (...data) {
  console.log(process.pid + " subscribed to - " + data[0]);
  return _subscribe.apply(this, data as any);
};

pubSub.publish = function (...data) {
  console.log(
    process.pid +
      " publish event " +
      data[0] +
      " with data: " +
      JSON.stringify(data[1])
  );
  return _publish.apply(this, data);
};

export { pubSub };
