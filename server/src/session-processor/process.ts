import * as path from "path";
import { generateRedisSessionProcessorName } from "./utils";
import { processManager } from "./manager";
import { listenForSessionProcessorActionResult } from "./communication";
import { SessionProcessorMessage } from "./types";
import { RedisPubSub } from "graphql-redis-subscriptions";
import config from "../config";

const sessionProcessorStartScript = path.resolve(__basedir, "index.js");
const sessionProcessorStaticArgs = ["--session-processor"];
const nodeArgs = config.app.sessionProcessDebug
  ? [config.app.sessionProcessDebug]
  : [];

export function startSessionProcess({
  sessionId,
  pubSub,
}: {
  sessionId: string;
  pubSub: RedisPubSub;
}) {
  const processorName = generateRedisSessionProcessorName({ sessionId });

  const messageCheckFn = (message: any) =>
    message?.type === SessionProcessorMessage.SESSION_PROCESSOR_STARTED;

  const sessionProcessorStarted = listenForSessionProcessorActionResult({
    sessionId,
    pubSub,
    messageCheckFn,
  });

  return Promise.all([
    processManager.startProcess({
      scriptLocation: sessionProcessorStartScript,
      processName: processorName,
      args: sessionProcessorStaticArgs.concat([sessionId]),
      nodeArgs,
    }),
    sessionProcessorStarted,
  ]);
}
