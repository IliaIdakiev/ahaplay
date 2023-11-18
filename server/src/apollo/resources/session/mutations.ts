import {
  dispatchActionToProcessor,
  startSessionProcessor,
} from "../../../session-processor";
import {
  createDisconnectAction,
  createJoinAction,
  createReadyToStartAction,
  createSetReadyAction,
  createSetValueAction,
} from "../../../session-processor/+xstate";
import { AuthenticatedAppContext, SessionStateGraphQL } from "../../types";
import {
  graphqlInMemorySessionStateSerializer,
  publishSessionState,
} from "./helpers";

export const mutationResolvers = {
  join(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<SessionStateGraphQL> {
    const sessionId = data.sessionId;
    const pubSub = context.pubSub;
    const action = createJoinAction({
      profileId: context.authenticatedProfile.profileId,
    });

    return startSessionProcessor({ sessionId })
      .then(() => dispatchActionToProcessor({ sessionId, action }))
      .then(graphqlInMemorySessionStateSerializer)
      .then((sessionStateGraphQL) =>
        publishSessionState({ sessionId, pubSub, sessionStateGraphQL })
      );
  },

  disconnect(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<SessionStateGraphQL> {
    const sessionId = data.sessionId;
    const pubSub = context.pubSub;
    const action = createDisconnectAction({
      profileId: context.authenticatedProfile.profileId,
    });
    return startSessionProcessor({ sessionId })
      .then(() => dispatchActionToProcessor({ sessionId, action }))
      .then(graphqlInMemorySessionStateSerializer)
      .then((sessionStateGraphQL) =>
        publishSessionState({ sessionId, pubSub, sessionStateGraphQL })
      );
  },

  readyToStart(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<SessionStateGraphQL> {
    const sessionId = data.sessionId;
    const pubSub = context.pubSub;
    const action = createReadyToStartAction({
      profileId: context.authenticatedProfile.profileId,
    });
    return startSessionProcessor({ sessionId })
      .then(() => dispatchActionToProcessor({ sessionId, action }))
      .then(graphqlInMemorySessionStateSerializer)
      .then((sessionStateGraphQL) =>
        publishSessionState({ sessionId, pubSub, sessionStateGraphQL })
      );
  },

  setActivityValue(
    _: undefined,
    data: { sessionId: string; activityId: string; value: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<SessionStateGraphQL> {
    const { sessionId, activityId, value } = data;
    const pubSub = context.pubSub;
    const action = createSetValueAction({
      profileId: context.authenticatedProfile.profileId,
      activityId,
      value,
    });
    return startSessionProcessor({ sessionId })
      .then(() => dispatchActionToProcessor({ sessionId, action }))
      .then(graphqlInMemorySessionStateSerializer)
      .then((sessionStateGraphQL) =>
        publishSessionState({ sessionId, pubSub, sessionStateGraphQL })
      );
  },

  setActivityReady(
    _: undefined,
    data: { sessionId: string; activityId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<SessionStateGraphQL> {
    const { sessionId, activityId } = data;
    const pubSub = context.pubSub;
    const action = createSetReadyAction({
      profileId: context.authenticatedProfile.profileId,
      activityId,
    });
    return startSessionProcessor({ sessionId })
      .then(() => dispatchActionToProcessor({ sessionId, action }))
      .then(graphqlInMemorySessionStateSerializer)
      .then((sessionStateGraphQL) =>
        publishSessionState({ sessionId, pubSub, sessionStateGraphQL })
      );
  },
};
