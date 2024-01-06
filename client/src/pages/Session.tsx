import { PropsWithChildren, useContext, useEffect } from "react";
import { SessionContext } from "../contexts/Session";
import { useMatches, Navigate } from "react-router-dom";
import { getInvite, getSession } from "../+xstate/actions/session";
import { GlobalContext } from "../contexts/Global";
import { SessionState } from "../+xstate/machines/session";
import { JitsiSetup } from "../components/JitsiSetup/JitsiSetup";

export default function Session(props: PropsWithChildren) {
  const matches = useMatches();
  const sessionContext = useContext(SessionContext);
  const globalContext = useContext(GlobalContext);

  const slotMatch = matches.find((item) => item.id === "session-slot");
  const instanceMatch = matches.find((item) => item.id === "session-instance");

  const slotInstance = sessionContext.context.slot;
  const sessionInstance = sessionContext.context.session;

  useEffect(() => {
    if (sessionContext.context.error) return;

    if (slotMatch && !slotInstance) {
      const slotId = slotMatch.params.slotId!;
      const email = globalContext.auth.context.profile!.email;
      return void sessionContext.send(getInvite({ email, slotId }));
    }
    if (instanceMatch && !sessionInstance) {
      const sessionKey = instanceMatch.params.sessionKey!;
      const includeSlotAndWorkshop = !slotInstance;
      return void sessionContext.send(
        getSession({ sessionKey, includeSlotAndWorkshop })
      );
    }
  }, [
    globalContext.auth.context.profile,
    instanceMatch,
    matches,
    sessionContext,
    sessionInstance,
    slotInstance,
    slotMatch,
  ]);

  if (matches.length < 3) return <Navigate to="/" />;
  if (sessionContext.context.error) return <div>Error</div>;

  const slot = sessionContext.context?.slot;
  const workshop = slot?.workshop;
  console.log("Session.tsx", sessionContext.state, workshop);
  if (!instanceMatch && !!slot?.key)
    return <Navigate to={`/session/instance/${slot.key}`} />;
  const invitationNotFound =
    sessionContext.state === SessionState.InvitationNotFound;
  const sessionNotFound = sessionContext.state === SessionState.SessionNotFound;
  const isProcessing =
    sessionContext.state === SessionState.Initial ||
    sessionContext.state === SessionState.Invite;

  return isProcessing ? (
    <div>Processing...</div>
  ) : (
    <div>
      <h1>Session</h1>
      {sessionInstance && <JitsiSetup sessionId={sessionInstance.id} />}
      <div>{JSON.stringify(workshop, null, 2)}</div>
      {invitationNotFound && <div>Invitation not found</div>}
      {sessionNotFound && <div>Session not found</div>}
    </div>
  );
}
