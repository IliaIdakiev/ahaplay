export function generateRedisSessionClientName({
  sessionId,
}: {
  sessionId: string;
}) {
  return `ahaplay-session-processor-${sessionId}`;
}

export function generateRedisSessionProcessorName({
  sessionId,
}: {
  sessionId: string;
}) {
  return `ahaplay-session-processor-${sessionId}`;
}
