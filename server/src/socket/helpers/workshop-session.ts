import { subMinutes, isAfter } from "date-fns";
import { isEqual } from "lodash";
import config from "../../config";

const sessionOpeningTimeInMinutes = config.workshop.sessionOpeningTimeInMinutes;

export function isSessionOpen(sessionStartTime: Date): boolean {
  const sessionOpeningTime = subMinutes(
    sessionStartTime,
    sessionOpeningTimeInMinutes
  );

  const currentDateTime = new Date();
  return isAfter(currentDateTime, sessionOpeningTime);
}

export function hasSessionStarted(sessionStartTime: Date): boolean {
  const currentDateTime = new Date();
  return (
    isEqual(currentDateTime, sessionStartTime) ||
    isAfter(currentDateTime, sessionStartTime)
  );
}
