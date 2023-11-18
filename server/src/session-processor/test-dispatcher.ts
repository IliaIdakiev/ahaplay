import { dispatchActionToProcessor, startSessionProcessor } from ".";
import { connectRedis } from "../redis";
import { createJoinAction, createReadyToStartAction } from "./+xstate";

const args = process.argv.slice(2);
const sessionId = args[0];
if (!sessionId) {
  throw new Error("No session id provided");
}

connectRedis()
  .then(() => startSessionProcessor({ sessionId }))
  .then(() => {
    return Promise.all([
      dispatchActionToProcessor({
        sessionId,
        action: createJoinAction({ profileId: "1" }),
      }),
      dispatchActionToProcessor({
        sessionId,
        action: createJoinAction({ profileId: "2" }),
      }),
      dispatchActionToProcessor({
        sessionId,
        action: createJoinAction({ profileId: "3" }),
      }),
    ]);
  })
  .then(() => {
    return Promise.all([
      dispatchActionToProcessor({
        sessionId,
        action: createReadyToStartAction({ profileId: "1" }),
      }),
      dispatchActionToProcessor({
        sessionId,
        action: createReadyToStartAction({ profileId: "2" }),
      }),
      dispatchActionToProcessor({
        sessionId,
        action: createReadyToStartAction({ profileId: "3" }),
      }),
    ]);
  });
