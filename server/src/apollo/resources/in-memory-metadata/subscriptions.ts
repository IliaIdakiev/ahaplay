import { AuthenticatedAppContext } from "../../types";
import { withCancel } from "../utils";
import {
  generateProfileUpdateSubscriptionEvent,
  generateSessionUpdateSubscriptionEvent,
} from "./helpers";
import * as controller from "./controller";

export const subscriptionResolvers = {
  inMemorySessionMetadataState: {
    subscribe(
      _: undefined,
      data: { slotId: string; sessionId?: string },
      context: AuthenticatedAppContext,
      info: any
    ) {
      const { pubSub } = context;
      const { profileId } = context.authenticatedProfile;
      const { sessionId, slotId } = data;
      const handler = sessionId
        ? controller.handleSessionSubscriptionForSessionId(profileId, sessionId)
        : controller.handleSessionSubscriptionWithSlotId(profileId, slotId);

      return handler.then((inMemorySessionMetadataState) => {
        const eventName = generateSessionUpdateSubscriptionEvent({
          sessionId: inMemorySessionMetadataState.sessionId,
        });
        controller.readAndPublishInMemorySessionMetadataState(
          inMemorySessionMetadataState.sessionId,
          pubSub
        );
        const asyncIterator = context.pubSub.asyncIterator(eventName);
        return withCancel(asyncIterator, () => {
          controller.handleSessionUnsubscribe(
            profileId,
            inMemorySessionMetadataState.sessionId,
            pubSub
          );
        });
      });
    },
  },
  inMemoryProfileMetadataState: {
    subscribe(
      _: undefined,
      data: { sessionId: string },
      context: AuthenticatedAppContext,
      info: any
    ) {
      const eventName = generateProfileUpdateSubscriptionEvent({
        sessionId: data.sessionId,
      });
      const asyncIterator = context.pubSub.asyncIterator(eventName);
      controller.readAndPublishInMemoryProfileMetadataState(
        data.sessionId,
        context.pubSub
      );
      return asyncIterator;
    },
  },
};
