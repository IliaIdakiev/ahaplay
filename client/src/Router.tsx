import { PropsWithChildren, useContext } from "react";
import {
  createBrowserRouter,
  Link,
  Navigate,
  Outlet,
  RouterProvider,
  useMatches,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Session from "./pages/Session";
import Logout from "./pages/Logout";
import { GlobalContext } from "./contexts/Global";
import { AuthState } from "./+xstate/machines/auth";
import { SessionContextProvider } from "./contexts/Session";

const authRequired = ["dashboard", "session", "logout"];
const noAuthRequired = ["login"];

const Root = () => {
  const {
    auth: { state, context },
  } = useContext(GlobalContext);

  const [, main] = useMatches();
  const isLoggedIn = state === AuthState.Authenticated;

  const redirect =
    isLoggedIn && noAuthRequired.includes(main.id) ? (
      <Navigate to="/" />
    ) : !isLoggedIn && authRequired.includes(main.id) ? (
      <Navigate to="/login" />
    ) : null;

  const profile = context.profile;
  return redirect ? (
    redirect
  ) : (
    <>
      <div>
        {isLoggedIn && (
          <div>
            Hello, {profile!.email}
            <Link to="/logout">Logout</Link>
          </div>
        )}
      </div>
      <Outlet />
    </>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    id: "root",
    children: [
      {
        path: "/",
        element: <Dashboard />,
        id: "dashboard",
      },
      {
        id: "session",
        path: "/session",
        element: (
          <SessionContextProvider>
            <Session />
          </SessionContextProvider>
        ),
        children: [
          {
            id: "session-slot",
            path: "slot/:slotId",
            index: true,
          },
          {
            id: "session-instance",
            path: "instance/:sessionKey",
            index: true,
          },
        ],
      },
      {
        path: "/login",
        element: <Login />,
        id: "login",
      },
      {
        path: "/logout",
        element: <Logout />,
        id: "logout",
      },
    ],
  },
]);

export default function Router(props: PropsWithChildren) {
  return <RouterProvider router={router} />;
}
