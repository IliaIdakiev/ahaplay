import * as path from "path";
import { generateRedisSessionProcessorName } from "./utils";
import { processManager } from "./manager";
import { listenForSessionProcessorActionResult } from "./communication";
import { SessionProcessorMessage } from "./types";
import { RedisPubSub } from "graphql-redis-subscriptions";
import config from "../config";
import { redisClient } from "../redis";

const sessionProcessorStartScript = path.resolve(__basedir, "index.js");
const sessionProcessorStaticArgs = ["--session-processor"];
const isDebug = !!process.argv.some((arg) => arg.startsWith("--sp-inspect"));
const isDebugBrk = !!process.argv.some((arg) =>
  arg.startsWith("--sp-inspect-brk")
);

const nodeArgs =
  config.app.sessionProcessorDebugPort && isDebug && isDebugBrk
    ? [`--inspect-brk=${config.app.sessionProcessorDebugPort}`]
    : isDebug
    ? [`--inspect=${config.app.sessionProcessorDebugPort}`]
    : [];

export function startSessionProcess({
  sessionId,
  pubSub,
}: {
  sessionId: string;
  pubSub: RedisPubSub;
}) {
  const processorName = generateRedisSessionProcessorName({ sessionId });
  let kill: () => void;
  const killPromise = new Promise<void>((res) => (kill = res));
  const messageCheckFn = (message: any) =>
    message?.type === SessionProcessorMessage.SESSION_PROCESSOR_STARTED &&
    message?.data?.sessionId === sessionId;

  const processStartPromise = Promise.race([
    listenForSessionProcessorActionResult({
      sessionId,
      pubSub,
      messageCheckFn,
    }),
    killPromise,
  ]);

  return Promise.all([
    processManager.startOrReturnExistingOneProcess({
      scriptLocation: sessionProcessorStartScript,
      processName: processorName,
      args: sessionProcessorStaticArgs.concat([sessionId]),
      nodeArgs,
    }),
    redisClient.get(processorName),
  ]).then(([{ id, isNew }, processReady]) => {
    if (isNew) {
      if (processReady) {
        kill();
        return id;
      }
      return processStartPromise.then(() => id);
    }
    return id;
  });
}
