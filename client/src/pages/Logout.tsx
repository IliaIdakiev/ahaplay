import { useContext, useEffect } from "react";
import { logout } from "../+xstate/actions/auth";
import { Navigate } from "react-router-dom";
import { GlobalContext } from "../contexts/Global";
import { AuthState } from "../+xstate/machines/auth";

export default function Logout() {
  const {
    auth: { send, state },
  } = useContext(GlobalContext);

  useEffect(() => {
    send(logout());
  }, [send]);

  return state === AuthState.Authenticated ? (
    <div>Logging out...</div>
  ) : (
    <Navigate to="/login" />
  );
}
