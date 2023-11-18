import { AuthenticatedAppContext } from "../../types";
import { withCancel } from "../utils";
import { generateSessionUpdateSubscriptionEvent } from "./helpers";

export const subscriptionResolvers = {
  sessionState: {
    subscribe(
      _: undefined,
      data: { sessionId: string },
      context: AuthenticatedAppContext,
      info: any
    ) {
      const { sessionId } = data;
      const eventName = generateSessionUpdateSubscriptionEvent({ sessionId });
      const asyncIterator = context.pubSub.asyncIterator(eventName);
      return withCancel(asyncIterator, () => {
        console.log("Subscription disconnected");
      });
    },
  },
};
