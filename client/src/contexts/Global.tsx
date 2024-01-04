import { PropsWithChildren, createContext, useEffect, useMemo } from "react";
import { useMachine } from "@xstate/react";
import {
  AuthMachineContext,
  AuthState,
  authMachine,
} from "../+xstate/machines/auth";
import { EventDescriptor } from "xstate";

type EventsArray = (typeof authMachine)["events"];
type Events = EventsArray extends Array<EventDescriptor<infer U>> ? U : never;

export const GlobalContext = createContext<{
  auth: {
    send: (action: Events) => void;
    state: AuthState;
    context: AuthMachineContext;
  };
}>({} as any);

export const GlobalContextProvider = (props: PropsWithChildren) => {
  const snapshot = useMemo(() => {
    const snapshotString = localStorage.getItem("auth-snapshot");
    if (!snapshotString) return null;
    try {
      return JSON.parse(snapshotString);
    } catch (e) {
      return null;
    }
  }, []);

  const [state, send, actor] = useMachine(authMachine, {
    snapshot,
    devTools: true,
  });

  useEffect(() => {
    actor.subscribe((snapshot) => {
      localStorage.setItem("auth-snapshot", JSON.stringify(snapshot));
    });
    window.addEventListener("getToken", () => {
      const token = actor.getSnapshot().context.token;
      window.dispatchEvent(new CustomEvent("sendToken", { detail: { token } }));
    });
  }, [actor]);

  const value = useMemo(
    () => ({
      auth: {
        send: (action: Events) => send(action),
        state: state.value as AuthState,
        context: state.context as AuthMachineContext,
      },
    }),
    [send, state.context, state.value]
  );

  (window as any)._auth = state;
  return (
    <GlobalContext.Provider value={value}>
      {props.children}
    </GlobalContext.Provider>
  );
};
