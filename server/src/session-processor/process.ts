import * as path from "path";
import { generateRedisSessionProcessorName } from "./utils";
import { processManager } from "./manager";
import { listenForSessionProcessorActionResult } from "./communication";
import { SessionProcessorMessage } from "./types";
import { RedisPubSub } from "graphql-redis-subscriptions";
import config from "../config";

const sessionProcessorStartScript = path.resolve(__basedir, "index.js");
const sessionProcessorStaticArgs = ["--session-processor"];
const nodeArgs =
  config.app.sessionProcessorDebugPort && __is_debug
    ? [`--inspect-brk=${config.app.sessionProcessorDebugPort}`]
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

  let existingProcessResolve: (data: string) => void;
  const existingProcess = new Promise<string>((res) => {
    existingProcessResolve = res;
  });

  return Promise.all([
    processManager
      .startOrReturnExistingOneProcess({
        scriptLocation: sessionProcessorStartScript,
        processName: processorName,
        args: sessionProcessorStaticArgs.concat([sessionId]),
        nodeArgs,
      })
      .then(({ id, isNew }) => {
        if (!isNew) {
          existingProcessResolve(id);
        }
        return id as string;
      }),
    Promise.race([sessionProcessorStarted, existingProcess]),
  ]);
}
