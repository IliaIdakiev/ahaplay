import { gql } from "@apollo/client";
import { client } from "../client";
import { SessionStateResult } from "../types/session-state-result";

const query = gql`
  subscription Subscription($sessionId: String) {
    sessionState(sessionId: $sessionId) {
      context {
        activityResult {
          key
          value {
            key
            value {
              profileId
              ready
              value
            }
          }
        }
        currentActiveProfiles
        lastUpdatedTimestamp
        readyActiveProfiles
      }
      value
    }
  }
`;

export function openSessionStateSubscription(variables: { sessionId: string }) {
  return client.subscribe<SessionStateResult>({ query, variables });
}
