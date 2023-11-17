export function createJoinAction(data: { profileId: string }) {
  return { type: "join" as const, ...data };
}
export function createActivityTimeoutAction(data: { activityId: string }) {
  return { type: "activityTimeout" as const, ...data };
}
export function createDisconnectAction(data: { profileId: string }) {
  return { type: "disconnect" as const, ...data };
}
export function createReadyToStartAction(data: { profileId: string }) {
  return { type: "readyToStart" as const, ...data };
}
export function createSetValueAction(data: {
  profileId: string;
  activityId: string;
  value: string;
}) {
  return { type: "setValue" as const, ...data };
}
export function createSetReadyAction(data: {
  profileId: string;
  activityId: string;
}) {
  return { type: "setReady" as const, ...data };
}