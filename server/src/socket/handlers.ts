import { Socket } from "socket.io";
import { JoinData } from "./interfaces";
import {
  SlotStatus,
  WorkshopModelInstance,
  models,
  profileAssociationNames,
  workspaceAssociationNames,
} from "../database";
import { WorkshopServerEvents, WorkshopClientEvents } from "./event-names";
import { generateSessionKey, isSessionOpen } from "./helpers";
import { QuizSessionState } from "../workshops/quiz/store";
import { Store } from "redux";
import { createNewQuizSessionStore } from "../workshops/quiz/store";
import { QuizActions } from "../workshops/quiz/actions";
import { HandlersContext, SessionConnections } from "./typings";

function initializeNewSession(
  connections: SessionConnections,
  workshop: WorkshopModelInstance
): Store<QuizSessionState, QuizActions> {
  const store = createNewQuizSessionStore(workshop);
  store.subscribe(() => {
    const newState = store.getState();
    console.log("new global state", newState);
  });

  return new Proxy(store, {
    get(target, key, receiver) {
      if (key === "dispatch") {
        return function (this: typeof store, action: QuizActions) {
          console.log("dispatch new global action", action);
          return Reflect.get(target, key, receiver).call(this, action);
        };
      }
    },
  });
}

export function createWorkshopHandlersForSocket(
  socket: Socket,
  context: HandlersContext
): Record<WorkshopServerEvents, (data: any) => void> {
  const { workshopSessions } = context;
  return {
    [WorkshopServerEvents.Join]: function onJoinHandler(data: JoinData): void {
      models.slot
        .findByPk(data.slotId, {
          include: [
            { model: models.workspace, as: workspaceAssociationNames.singular },
            { model: models.profile, as: profileAssociationNames.singular },
          ],
        })
        .then((slot) => {
          const hasFoundSlot = !!slot;
          if (!hasFoundSlot || slot?.status === SlotStatus.CANCELLED) {
            const clientEvent = !hasFoundSlot
              ? WorkshopClientEvents.SlotNotFound
              : WorkshopClientEvents.SlotCancelled;
            return void socket.send(clientEvent, slot);
          }
          if (!isSessionOpen(slot.schedule_date)) {
            return void socket.send(WorkshopClientEvents.SessionNotOpen, slot);
          }
          const {
            schedule_date: scheduleDate,
            workshop_id: workshopId,
            workspace_id: workspaceId,
          } = slot;

          const sessionKey = generateSessionKey({
            scheduleDate,
            workshopId,
            workspaceId,
          });

          let currentWorkshopSession = workshopSessions.get(sessionKey) || null;
          const sessionConnections = currentWorkshopSession?.connections || [];

          if (!currentWorkshopSession) {
            const store = initializeNewSession(
              sessionConnections,
              slot.workshop!
            );
            currentWorkshopSession = {
              connections: sessionConnections,
              store,
            };
          }

          const newSessionConnectionEntry = {
            socket,
            profile: slot.profile!,
          };

          currentWorkshopSession.connections.push(newSessionConnectionEntry);
        });
    },
  } as const;
}
