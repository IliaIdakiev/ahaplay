import { Unpack } from "./types";

export function raceWithSubscription<
  T extends {
    subscribe: (event: string, fn: (data: any) => void) => Promise<number>;
    unsubscribe: (id: number) => void;
    publish: (event: string, data: F) => void;
  },
  F extends any = any
>(
  pubSub: T,
  eventName: string,
  asyncFn: () => Promise<F>,
  asyncFnValueCheckFn: (value: F) => boolean = (value) => !!value
) {
  let force: () => void;
  const forceResolver = new Promise<any>((res) => (force = () => res(null)));

  const _racers = [
    new Promise<number | null>((res, rej) => {
      let subscriptionId: number | null = null;
      pubSub
        .subscribe(eventName, (val) => {
          if (subscriptionId) {
            pubSub.unsubscribe(subscriptionId);
            subscriptionId = null;
          }
          res(val);
        })
        .then((id) => {
          subscriptionId = id;
          const _force = force;
          force = () => {
            if (subscriptionId) {
              pubSub.unsubscribe(subscriptionId);
              subscriptionId = null;
            }
            res(null);
            _force();
          };
        })
        .catch((err) => rej(err));
    }),
    new Promise((res) => {
      asyncFn().then((value) => {
        if (asyncFnValueCheckFn(value)) {
          setTimeout(() => force());
          return void res(value);
        }
        const _force = force;
        force = () => {
          res(null);
          _force();
        };
      });
    }),
    forceResolver,
  ];
  const subscription = Promise.race<Unpack<ReturnType<typeof asyncFn>> | null>(
    _racers
  );

  return {
    get force() {
      return force;
    },
    publish: (value: Unpack<ReturnType<typeof asyncFn>>) => {
      pubSub.publish(eventName, value);
    },
    subscription,
    _racers,
  };
}
