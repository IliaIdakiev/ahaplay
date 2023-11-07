import { connectRedis, pubSub } from "../redis";
import { SessionProcessorMessage } from "./types";
import {
  createProcessorMessage,
  generateRedisSessionProcessListenerName,
  generateRedisSessionProcessReceiverName,
} from "./utils";

const args = process.argv.slice(2);
const sessionId = args[0];
if (!sessionId) {
  throw new Error("No session id provided");
}

function publishMessage(message: string) {
  return pubSub.publish(
    generateRedisSessionProcessReceiverName(process.pid.toString()),
    message
  );
}

connectRedis().then(() => {
  publishMessage(
    createProcessorMessage(SessionProcessorMessage.SESSION_PROCESSOR_STARTED)
  );

  setTimeout(() => {
    process.exit();
  }, 5000);

  pubSub.subscribe(
    generateRedisSessionProcessListenerName(sessionId),
    (message) => {
      console.log(message);
    }
  );
});

process.on("exit", () => {
  publishMessage(
    createProcessorMessage(SessionProcessorMessage.SESSION_PROCESSOR_STOPPED)
  );
});
