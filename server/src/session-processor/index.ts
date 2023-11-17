import * as path from "path";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { redisClient, pubSub } from "../redis";
import {
  generateRedisSessionProcessorPidKey,
  generateRedisSessionProcessorSessionIdKey,
  generateRedisSessionClientName,
  generateRedisSessionProcessorName,
} from "./utils";
import { Unpack } from "../types";
import { InMemoryMetadataActions, createInMemoryDispatcher } from "./+state";
import {
  PubSubActionMessage,
  PubSubActionMessageResult,
  PubSubMessage,
  SessionProcessorMessage,
} from "./types";

const pathToSessionProcessorScript = path.join(__basedir, "index.js");

const childProcesses: ChildProcessWithoutNullStreams[] = [];

export function startSessionProcessor(sessionId: string) {
  const sessionIdSessionProcessorPidKey =
    generateRedisSessionProcessorSessionIdKey(sessionId);
  return redisClient
    .get(sessionIdSessionProcessorPidKey)
    .then((existingPid) => {
      if (existingPid) {
        const sessionProcessorPidSessionIdKey =
          generateRedisSessionProcessorPidKey(existingPid);
        return Promise.all([
          redisClient
            .set(sessionIdSessionProcessorPidKey, existingPid)
            .then(() => sessionIdSessionProcessorPidKey),
          redisClient
            .set(sessionProcessorPidSessionIdKey, sessionId)
            .then(() => sessionProcessorPidSessionIdKey),
          existingPid,
        ]);
      }

      let childProcess;
      try {
        childProcess = spawn("node", [
          pathToSessionProcessorScript,
          sessionId,
          "--session-processor",
        ]);
      } catch (e) {
        throw new Error("Cannot spawn process!");
      }
      childProcesses.push(childProcess);

      childProcess.stdout.on("data", (data) => {
        // Log the child process stdout in the parent process
        console.log(`Child Process STDOUT: ${data}`);
      });

      // Listen for data events on the child process stderr (optional)
      childProcess.stderr.on("data", (data) => {
        // Log the child process stderr in the parent process
        console.error(`Child Process STDERR: ${data}`);
      });

      const pid = childProcess.pid!.toString();
      const sessionProcessorPidSessionIdKey =
        generateRedisSessionProcessorPidKey(pid);

      const connected = new Promise<void>((res) => {
        let resolved = false;
        pubSub.subscribe(
          generateRedisSessionClientName({ sessionId }),
          (event) => {
            console.log(`PID: ${pid}:`, event);
            if (
              event?.type ===
                SessionProcessorMessage.SESSION_PROCESSOR_STARTED &&
              resolved === false
            ) {
              resolved = true;
              res();
            }
          }
        );
      });

      return Promise.all([
        redisClient
          .set(sessionIdSessionProcessorPidKey, pid)
          .then(() => sessionIdSessionProcessorPidKey),
        redisClient
          .set(sessionProcessorPidSessionIdKey, sessionId)
          .then(() => sessionProcessorPidSessionIdKey),
        connected.then(() => pid),
      ]);
    });
}

export function messageSessionProcessor({
  pid,
  message,
}: {
  pid: string;
  message: any;
}) {
  return pubSub.publish(generateRedisSessionProcessorName({ pid }), message);
}

export function dispatchActionToProcessor(
  sessionId: string,
  action: InMemoryMetadataActions,
  allowNullProfile: boolean = false
) {
  const redisSessionProcessorSessionIdKey =
    generateRedisSessionProcessorSessionIdKey(sessionId);

  return redisClient
    .get(redisSessionProcessorSessionIdKey)
    .then((pid) =>
      pid ? pid : startSessionProcessor(sessionId).then(([, , pid]) => pid)
    )
    .then((pid) => {
      const message: PubSubActionMessage = {
        type: SessionProcessorMessage.DISPATCH_ACTION,
        data: {
          action,
          allowNullProfile,
        },
      };
      return messageSessionProcessor({ pid, message }).then(() =>
        listenForSessionProcessorActionResult(sessionId, action)
      );
    });
}

type ReducerResult = Unpack<
  ReturnType<Unpack<ReturnType<typeof createInMemoryDispatcher>>>
>;

export function listenForSessionProcessorActionResult(
  sessionId: string,
  action: InMemoryMetadataActions
) {
  return new Promise<ReducerResult>((res, rej) => {
    let subscriptionId: number | null = null;

    const handler = (message: PubSubMessage) => {
      if (
        [
          SessionProcessorMessage.UNCAUGHT_EXCEPTION,
          SessionProcessorMessage.UNHANDLED_REJECTION,
        ].includes(message.type)
      ) {
        return rej(message.data);
      }

      if (
        message.type !== SessionProcessorMessage.ACTION_RESULT ||
        (message as unknown as PubSubActionMessageResult).data.action === action
      )
        return;

      const actionResultMessage =
        message as unknown as PubSubActionMessageResult;
      res(actionResultMessage.data.result);
      pubSub.unsubscribe(subscriptionId!);
    };

    pubSub
      .subscribe(generateRedisSessionClientName({ sessionId }), handler)
      .then((id) => (subscriptionId = id));
  });
}

process.on("exit", () => {
  // TODO: think about if we should be killing or not, maybe only if it's intended shutdown
  childProcesses.forEach((p) => p.kill());
});
