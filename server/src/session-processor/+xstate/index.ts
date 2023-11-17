import { State, interpret } from "xstate";
import { SessionMachine, SessionMachineSnapshot } from "./types";
export * from "./action-creators";
export * from "./types";
export * from "./convert-workshop-to-machine";

export function createMachineService(
  machine: SessionMachine,
  serviceSnapshot?: SessionMachineSnapshot
) {
  const initialState = serviceSnapshot ? State.create(serviceSnapshot) : null;

  const service = interpret(machine).onTransition((state) =>
    console.log(state.value, state.context)
  );
  if (!initialState) return service.start();
  return service.start(initialState);
}
