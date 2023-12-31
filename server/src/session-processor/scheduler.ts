import { minutesToMilliseconds } from "date-fns";
import { StateValue, interpret } from "xstate";
import {
  SessionMachineSnapshot,
  createActivityPartTimeoutAction,
  createActivityTimeoutAction,
} from "./+xstate";
import EventEmitter from "events";

type EventNames = "workshopTimeout" | "activityTimeout" | "activityPartTimeout";

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
    if (workshopMinuteDuration)
      this.setupWorkshopTimeout(workshopMinuteDuration);
    this.service.subscribe(this.sessionStateChangeHandler.bind(this));
  }

  setupWorkshopTimeout(workshopMinuteDuration: number) {
    const durationInMilliseconds = minutesToMilliseconds(
      workshopMinuteDuration
    );
    this.workshopDurationTimerId = setTimeout(
      this.workshopTimeout.bind(this),
      durationInMilliseconds
    );
  }

  setupCurrentActivityTimeouts() {
    const state =
      this.service.getSnapshot() as unknown as SessionMachineSnapshot;
    const activity = Object.keys(state?.value || {})[0];
    if (!activity) return;
    const currentMode = (state?.value as any)[activity] as
      | "individual"
      | "group"
      | "review"
      | undefined;
    if (!currentMode || !state.machine) return;
    const activityMinuteTimeout =
      state.context.timeouts?.activity?.[activity]?.activityMinuteTimeout;
    if (activityMinuteTimeout && this.activityIdForTimer !== activity) {
      if (this.activityTimerId) {
        clearTimeout(this.activityTimerId);
        this.activityTimerId = null;
      }
      setTimeout(() => {
        this.activityTimerId = null;
        this.activityModeTimerId = null;
        const snapshot = this.service.send(
          createActivityTimeoutAction({ activityId: activity })
        );
        this.emit("activityTimeout", snapshot);
      }, minutesToMilliseconds(activityMinuteTimeout));
    }
    const modeMinuteTimeout =
      state.context.timeouts?.activity?.[activity]?.[
        currentMode === "individual"
          ? "individualMinuteTimeout"
          : currentMode === "group"
          ? "groupMinuteTimeout"
          : "reviewMinuteTimeout"
      ];
    if (modeMinuteTimeout && this.activityModeForTimer !== currentMode) {
      if (this.activityModeTimerId) {
        clearTimeout(this.activityModeTimerId);
        this.activityModeTimerId = null;
      }
      setTimeout(() => {
        this.activityModeTimerId = null;
        this.activityModeForTimer = null;
        const snapshot = this.service.send(
          createActivityPartTimeoutAction({ activityId: activity })
        );
        this.emit("activityPartTimeout", snapshot);
      }, minutesToMilliseconds(modeMinuteTimeout));
    }
  }

  on(
    event: EventNames,
    listener: (snapshot: SessionMachineSnapshot) => void
  ): this {
    return super.on(event, listener);
  }

  emit(event: EventNames, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  sessionStateChangeHandler() {
    this.setupCurrentActivityTimeouts();
  }

  getActivityIdFromStateValue(value: StateValue) {
    return typeof value === "string" ? value : Object.keys(value)[0];
  }

  getInnerStateFromStateValue(value: StateValue) {
    return typeof value === "string" ? null : Object.values(value)[0];
  }

  progressUntil(whileValueCheckFn: (stateValue: StateValue) => boolean) {
    let snapshot = this.service.getSnapshot();
    while (whileValueCheckFn(snapshot.value)) {
      const activityId = this.getActivityIdFromStateValue(snapshot.value);
      snapshot = this.service.send(
        createActivityTimeoutAction({ activityId, force: true })
      );
    }
    return snapshot;
  }

  workshopTimeout() {
    const snapshot = this.progressUntil((value) => value !== "viewResults");
    this.emit("workshopTimeout", snapshot);
  }
}
