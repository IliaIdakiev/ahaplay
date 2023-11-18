import { minutesToMilliseconds } from "date-fns";
import { StateValue, interpret } from "xstate";
import { SessionMachineSnapshot, createActivityTimeoutAction } from "./+xstate";
import EventEmitter from "events";

type EventNames = "workshopTimeout" | "activityTimeout";

export class Scheduler extends EventEmitter {
  workshopDurationTimerId: NodeJS.Timeout | null = null;
  activityTimerId: NodeJS.Timeout | null = null;
  activityIdForTimer: string | null = null;

  activityModeTimerId: NodeJS.Timeout | null = null;
  activityModeForTimer: "individual" | "group" | "review" | null = null;

  constructor(
    private service: ReturnType<typeof interpret>,
    workshopMinuteDuration?: number
  ) {
    super();
    if (workshopMinuteDuration) {
      const durationInMilliseconds = minutesToMilliseconds(
        workshopMinuteDuration
      );
      this.workshopDurationTimerId = setTimeout(
        this.workshopTimeout.bind(this),
        durationInMilliseconds
      );
    }
    this.service.subscribe(this.sessionStateChangeHandler.bind(this));
  }

  on(event: EventNames, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  emit(event: EventNames, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  sessionStateChangeHandler() {
    const currentSnapshot =
      this.service.getSnapshot() as unknown as SessionMachineSnapshot;
    const activityId = this.getActivityIdFromStateValue(currentSnapshot.value);
    if (activityId !== this.activityIdForTimer) {
      if (this.activityTimerId) {
        clearInterval(this.activityTimerId);
        this.activityTimerId = null;
      }
      if (this.activityModeTimerId) {
        clearInterval(this.activityModeTimerId);
        this.activityModeForTimer = null;
      }
      if (currentSnapshot.context.activityMinuteTimeout) {
        this.activityIdForTimer = activityId;
        this.activityTimerId = setTimeout(() => {
          this.progressUntil(
            (value) =>
              this.getActivityIdFromStateValue(value) !==
              this.activityIdForTimer
          );
          this.activityTimerId = null;
          this.activityIdForTimer = null;
        }, minutesToMilliseconds(currentSnapshot.context.activityMinuteTimeout));
      }
      const innerState = this.getInnerStateFromStateValue(
        currentSnapshot.value
      );
      if (
        !activityId ||
        innerState === null ||
        typeof innerState !== "string" ||
        innerState === this.activityModeForTimer
      )
        return;
      const {
        individualMinuteTimeout,
        groupMinuteTimeout,
        readyActiveProfiles,
      } = currentSnapshot.context;
      const minuteTimeout =
        individualMinuteTimeout || groupMinuteTimeout || readyActiveProfiles;
      if (minuteTimeout) return;
      this.activityModeForTimer = innerState as
        | "individual"
        | "group"
        | "review";
      this.activityModeTimerId = setTimeout(() => {
        this.service.send(createActivityTimeoutAction({ activityId }));
      }, minutesToMilliseconds(minuteTimeout));
    }
  }

  getActivityIdFromStateValue(value: StateValue) {
    return typeof value === "string" ? value : Object.keys(value)[0];
  }

  getInnerStateFromStateValue(value: StateValue) {
    return typeof value === "string" ? null : Object.values(value)[0];
  }

  progressUntil(whileValueCheckFn: (stateValue: StateValue) => boolean) {
    let { value } = this.service.getSnapshot();
    while (whileValueCheckFn(value)) {
      const activityId = this.getActivityIdFromStateValue(value);
      value = this.service.send(
        createActivityTimeoutAction({ activityId })
      ).value;
    }
  }

  workshopTimeout() {
    this.progressUntil((value) => value !== "viewResults");
    // notify someone
  }
}
