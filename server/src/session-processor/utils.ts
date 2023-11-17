export function generateRedisSessionProcessorPidKey(pid: string) {
  return `processor-pid->session:${pid}`;
}

export function generateRedisSessionProcessorSessionIdKey(sessionId: string) {
  return `session->processor-pid:${sessionId}`;
}

export function generateRedisSessionClientName({
  sessionId,
}: {
  sessionId: string;
}) {
  return `ahaplay-session-processor-${sessionId}`;
}

export function generateRedisSessionProcessorName({ pid }: { pid: string }) {
  return `ahaplay-session-processor-${pid}`;
}
