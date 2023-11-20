import {
  createDisconnectAction,
  createJoinAction,
  createReadyToStartAction,
  createSetReadyAction,
  createSetValueAction,
} from "../../../session-processor/+xstate";
import { dispatchActionToProcessor } from "../../../session-processor/communication";
import { startSessionProcess } from "../../../session-processor/process";
import { AuthenticatedAppContext, SessionStateGraphQL } from "../../types";
import { graphqlInMemorySessionStateSerializer } from "./helpers";

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

    return startSessionProcess({ sessionId, pubSub })
      .then(() => dispatchActionToProcessor({ sessionId, action, pubSub }))
      .then((action) => graphqlInMemorySessionStateSerializer(action.data));
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
    return startSessionProcess({ sessionId, pubSub })
      .then(() => dispatchActionToProcessor({ sessionId, action, pubSub }))
      .then((action) => graphqlInMemorySessionStateSerializer(action.data));
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
    return startSessionProcess({ sessionId, pubSub })
      .then(() => dispatchActionToProcessor({ sessionId, action, pubSub }))
      .then((action) => graphqlInMemorySessionStateSerializer(action.data));
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
    return startSessionProcess({ sessionId, pubSub })
      .then(() => dispatchActionToProcessor({ sessionId, action, pubSub }))
      .then((action) => graphqlInMemorySessionStateSerializer(action.data));
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
    return startSessionProcess({ sessionId, pubSub })
      .then(() => dispatchActionToProcessor({ sessionId, action, pubSub }))
      .then((action) => graphqlInMemorySessionStateSerializer(action.data));
  },
};
