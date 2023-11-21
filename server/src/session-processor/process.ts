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

  let existingProcessResolve: () => void;
  const existingProcess = new Promise<void>((res) => {
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
      .then(({ process, isNew }) => {
        if (!isNew) {
          existingProcessResolve();
        }
        return process;
      }),
    Promise.race([sessionProcessorStarted, existingProcess]),
  ]);
}
