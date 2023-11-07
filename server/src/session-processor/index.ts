import * as path from "path";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { redisClient, pubSub } from "../redis";
import {
  generateRedisSessionProcessorPidSessionIdKey,
  generateRedisSessionIdSessionProcessorPidKey,
  generateRedisSessionProcessListenerName,
  generateRedisSessionProcessReceiverName,
  readProcessorMessage,
} from "./utils";

const pathToSessionProcessorScript = path.join(
  __basedir,
  "session-processor.js"
);

const childProcesses: ChildProcessWithoutNullStreams[] = [];

export function startSessionProcessor(sessionId: string) {
  let childProcess;
  try {
    childProcess = spawn("node", [pathToSessionProcessorScript, sessionId]);
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
  const sessionIdSessionProcessorPidKey =
    generateRedisSessionIdSessionProcessorPidKey(sessionId);
  const sessionProcessorPidSessionIdKey =
    generateRedisSessionProcessorPidSessionIdKey(pid);

  const connected = new Promise<void>((res) => {
    let resolved = false;
    console.log(`Tapped session processor pid: ${pid}`);
    pubSub.subscribe(
      generateRedisSessionProcessReceiverName(pid),
      (message) => {
        const event = readProcessorMessage(message);
        console.log(`PID: ${pid}:`, event);
        if (resolved === false) {
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
    connected.then(() => childProcesses),
  ]);
}

export function messageSessionProcessor(sessionId: string, message: string) {
  return redisClient.publish(
    generateRedisSessionProcessListenerName(sessionId),
    message
  );
}

process.on("exit", () => {
  // TODO: think about if we should be killing or not, maybe only if it's intended shutdown
  childProcesses.forEach((p) => p.kill());
});
