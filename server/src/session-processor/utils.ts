import { SessionProcessorMessage } from "./types";

export function generateRedisSessionProcessorPidSessionIdKey(pid: string) {
  return `processor-pid->session:${pid}`;
}

export function generateRedisSessionIdSessionProcessorPidKey(
  sessionId: string
) {
  return `session->processor-pid:${sessionId}`;
}

export function generateRedisSessionProcessListenerName(sessionId: string) {
  return `ahaplay-session-processor-${sessionId}`;
}

export function generateRedisSessionProcessReceiverName(pid: string) {
  return `ahaplay-session-processor-${pid}`;
}

export function createProcessorMessage<T>(
  message: SessionProcessorMessage,
  data?: T
) {
  return JSON.stringify({ message, data });
}

export function readProcessorMessage<T>(event: string): {
  message: SessionProcessorMessage;
  data: T;
} | null {
  try {
    return JSON.parse(event);
  } catch (e) {
    console.log("Malformed data!", e);
    return null;
  }
}
