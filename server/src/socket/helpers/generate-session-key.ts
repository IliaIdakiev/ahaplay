import { getUnixTime } from "date-fns";

export function generateSessionKey({
  workspaceId,
  workshopId,
  scheduleDate,
}: {
  workspaceId: string;
  workshopId: string;
  scheduleDate: Date;
}) {
  const scheduleUnixTime = getUnixTime(scheduleDate);
  return `${workspaceId}-${workshopId}-${scheduleUnixTime}`;
}
