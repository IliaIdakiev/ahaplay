import { FormEvent, PropsWithChildren, useCallback, useContext } from "react";
import * as Form from "@radix-ui/react-form";
import { login } from "../+xstate/actions//auth";
import { Navigate } from "react-router-dom";
import { GlobalContext } from "../contexts/Global";
import { AuthState } from "../+xstate/machines/auth";

export default function Login(props: PropsWithChildren) {
  const {
    auth: { send, state, context },
  } = useContext(GlobalContext);

  const loginHandler = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget)) as {
        email: string;
        password: string;
      };
      send(login(data));
    },
    [send]
  );
  const isAuthenticating = state === AuthState.Authenticating;
  const error = context.error;

  return state === AuthState.Authenticated ? (
    <Navigate to="/" />
  ) : (
    <Form.Root onSubmit={loginHandler}>
      <Form.Field name="email">
        <Form.Label>Email</Form.Label>
        <Form.Control />
      </Form.Field>
      <Form.Field name="password">
        <Form.Label>Password</Form.Label>
        <Form.Control type="password" />
      </Form.Field>
      <Form.Submit disabled={isAuthenticating}>Login</Form.Submit>
      {error && <div>{error}</div>}
    </Form.Root>
  );
}
