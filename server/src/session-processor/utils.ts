export function generateRedisSessionProcessorPidKey(pid: string) {
  return `processor-pid->session:${pid}`;
}

export function generateRedisSessionProcessorSessionIdKey(sessionId: string) {
  return `session->processor-pid:${sessionId}`;
}

export function generateRedisSessionProcessListenerName(sessionId: string) {
  return `ahaplay-session-processor-${sessionId}`;
}

export function generateRedisSessionProcessReceiverName(pid: string) {
  return `ahaplay-session-processor-${pid}`;
}
