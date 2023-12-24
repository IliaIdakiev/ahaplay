import { expect } from "chai";
import { raceWithSubscription } from "./utils";
import sinon from "sinon";

describe.only("Test utils", () => {
  describe("Test raceSubscription", () => {
    const dummyPubSub = {
      subscribe(event: string) {
        return Promise.resolve(1);
      },
      unsubscribe(id: number) {},
      publish(event: string) {},
    };

    it("should return value from async fn with default checker", async () => {
      const resolveValue = "SUCCESS";
      const subscriptionKey = "test key";

      try {
        const asyncFn = () =>
          new Promise((res) => {
            setTimeout(() => {
              res(resolveValue);
            }, 0);
          });

        const subscribeStub = sinon.stub(dummyPubSub, "subscribe");
        subscribeStub.resolves(1);
        const unsubscribeSpy = sinon.spy(dummyPubSub, "unsubscribe");

        const { subscription, force, _racers } = raceWithSubscription(
          dummyPubSub,
          subscriptionKey,
          asyncFn
        );

        const result = await subscription;
        const racer1 = await _racers[0];
        const racer2 = await _racers[1];
        const racer3 = await _racers[2];

        sinon.assert.callCount(subscribeStub, 1);
        sinon.assert.calledWith(subscribeStub, subscriptionKey);
        sinon.assert.callCount(unsubscribeSpy, 1);
        expect(result).to.equal(resolveValue);
        expect(racer1).to.equal(null);
        expect(racer2).to.equal(resolveValue);
        expect(racer3).to.equal(null);

        subscribeStub.restore();
        unsubscribeSpy.restore();
      } catch (e) {
        console.error(e);
        throw e;
      }
    });

    it("should return value from subscription", async () => {
      const resolveValue = "NOT THIS VALUE";
      const subscriptionKey = "test key";
      const subscriptionValue = "SUCCESS";

      try {
        const asyncFn = () =>
          new Promise((res) => {
            setTimeout(() => {
              res(resolveValue);
            }, 0);
          });

        const subscribeStub = sinon.stub(dummyPubSub, "subscribe");
        subscribeStub.resolves(1);
        const unsubscribeSpy = sinon.spy(dummyPubSub, "unsubscribe");

        const { subscription, force, _racers } = raceWithSubscription(
          dummyPubSub,
          subscriptionKey,
          asyncFn
        );

        Promise.resolve().then(() => {
          (subscribeStub.args[0] as any)[1](subscriptionValue);
        });

        const result = await subscription;
        const racer1 = await _racers[0];
        const racer2 = await _racers[1];
        const racer3 = await _racers[2];

        sinon.assert.callCount(subscribeStub, 1);
        sinon.assert.calledWith(subscribeStub, subscriptionKey);
        sinon.assert.callCount(unsubscribeSpy, 1);
        expect(result).to.equal(subscriptionValue);
        expect(racer1).to.equal(subscriptionValue);
        expect(racer2).to.equal(resolveValue);
        expect(racer3).to.equal(null);

        subscribeStub.restore();
        unsubscribeSpy.restore();
      } catch (e) {
        console.error(e);
        throw e;
      }
    });

    it("should return value null because it was forced", async () => {
      const resolveValue = "NOT THIS VALUE";
      const subscriptionKey = "test key";
      const subscriptionValue = "NOT THIS VALUE AS WELL";

      try {
        const asyncFn = () =>
          new Promise((res) => {
            setTimeout(() => {
              res(resolveValue);
            }, 0);
          });

        const subscribeStub = sinon.stub(dummyPubSub, "subscribe");
        subscribeStub.resolves(1);
        const unsubscribeSpy = sinon.spy(dummyPubSub, "unsubscribe");

        const { subscription, force, _racers } = raceWithSubscription(
          dummyPubSub,
          subscriptionKey,
          asyncFn
        );

        Promise.resolve().then(() => {
          force();
          (subscribeStub.args[0] as any)[1](subscriptionValue);
        });

        const result = await subscription;
        const racer1 = await _racers[0];
        const racer2 = await _racers[1];
        const racer3 = await _racers[2];

        sinon.assert.callCount(subscribeStub, 1);
        sinon.assert.calledWith(subscribeStub, subscriptionKey);
        sinon.assert.callCount(unsubscribeSpy, 1);
        expect(result).to.equal(null);
        expect(racer1).to.equal(subscriptionValue);
        expect(racer2).to.equal(resolveValue);
        expect(racer3).to.equal(null);

        subscribeStub.restore();
        unsubscribeSpy.restore();
      } catch (e) {
        console.error(e);
        throw e;
      }
    });
  });
});
