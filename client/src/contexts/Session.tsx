import { PropsWithChildren, createContext, useEffect, useMemo } from "react";
import { useMachine } from "@xstate/react";
import {
  SessionMachineContext,
  SessionState,
  sessionMachine,
} from "../+xstate/machines/session";
import { EventDescriptor } from "xstate";

type EventsArray = (typeof sessionMachine)["events"];
type Events = EventsArray extends Array<EventDescriptor<infer U>> ? U : never;

export const SessionContext = createContext<{
  send: (action: Events) => void;
  state: SessionState;
  context: SessionMachineContext;
}>({} as any);

export const SessionContextProvider = (props: PropsWithChildren) => {
  // const snapshot = useMemo(() => {
  //   const snapshotString = localStorage.getItem("auth-snapshot");
  //   if (!snapshotString) return null;
  //   try {
  //     return JSON.parse(snapshotString);
  //   } catch (e) {
  //     return null;
  //   }
  // }, []);

  const [state, send, actor] = useMachine(sessionMachine);

  useEffect(() => {
    actor.subscribe((snapshot) => {
      console.log(snapshot);
      // localStorage.setItem("auth-snapshot", JSON.stringify(snapshot));
    });
  }, [actor]);

  const value = useMemo(
    () => ({
      send: (action: Events) => send(action),
      state: state.value as SessionState,
      context: state.context as SessionMachineContext,
    }),
    [send, state.context, state.value]
  );

  return (
    <SessionContext.Provider value={value}>
      {props.children}
    </SessionContext.Provider>
  );
};
