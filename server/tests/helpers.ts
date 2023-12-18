import {
  ApolloClient,
  gql,
  HttpLink,
  InMemoryCache,
} from "@apollo/client/core";
import { Client, createClient, Event, EventListener } from "graphql-ws";
import WebSocket from "ws";

import * as https from "https";
import axios from "axios";
import fetch from "cross-fetch";

export const serverUrl = `http://localhost`;
export const apiUrl = `${serverUrl}/graphql`;
export const wsUrl = `ws://localhost/graphql`;

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: apiUrl, fetch }),
  cache: new InMemoryCache(),
});

export const createSubscriptionClient = (
  token: string,
  on?: Partial<{
    [event in Event]: EventListener<event>;
  }>
) =>
  createClient({
    url: wsUrl,
    webSocketImpl: WebSocket,
    connectionParams: {
      Authorization: `Bearer ${token}`,
    },
    on,
  });

export const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

export function delay(milliseconds: number) {
  return new Promise<void>((res) => {
    setTimeout(() => {
      res();
    }, milliseconds);
  });
}

export async function setupDatabase(ops: { key: string; data: any }[]) {
  const response = await instance.post(serverUrl + "/recreate-database", ops);
  return response.data;
}

export async function processOperations(ops: { key: string; data: any }[]) {
  const response = await instance.post(serverUrl + "/process-operations", ops);
  return response.data;
}

export function generateRequestHeaders(config: {
  origin?: string;
  authToken?: string;
}) {
  const headers: any = {
    Origin: config?.origin || "localhost",
  };

  if (config.authToken) {
    headers["Authorization"] = config.authToken;
  }

  return headers;
}

export function generateUserCreationRequestPayload(variables: {
  workspace_id: string;
  workspace: {
    status:
      | "ACTIVE"
      | "LEFT"
      | "UNSUBSCRIBED"
      | "ABSENCE"
      | "PROHIBITED"
      | "NONE";
    access: "ADMIN" | "SUPER_ADMIN" | "TEAM_MEMBER" | "OWNER" | "NONE";
    title: string;
  };
  email: string;
  name: string;
  password: string;
  headline?: string;
  image?: string;
}) {
  return {
    query: `
      mutation Mutation(
        $workspace_id: String!
        $name: String!
        $password: String!
        $workspace: WorkspaceProfileInput!
        $email: String!
        $headline: String
        $image: String
      ) {
        createProfile(
          workspace_id: $workspace_id
          name: $name
          password: $password
          workspace: $workspace
          email: $email
          headline: $headline
          image: $image
        ) {
          create_date
          email
          headline
          id
          image
          login_date
          is_completed
          name
          update_date
          workspace {
            access
            profile_id
            status
            title
            workspace_id
          }
        }
      }
    `,
    variables,
  };
}

export function generateWorkspaceCreationRequestPayload(variables: {
  name: string;
  domains?: {
    domain: string;
  }[];
  profiles?: {
    access: "ADMIN" | "SUPER_ADMIN" | "TEAM_MEMBER" | "OWNER" | "NONE";
    id: string;
    status:
      | "ACTIVE"
      | "LEFT"
      | "UNSUBSCRIBED"
      | "ABSENCE"
      | "PROHIBITED"
      | "NONE";
    title: string;
  }[];
}) {
  return {
    query: `
      mutation Mutation(
        $image: String
        $name: String!
        $domains: [DomainInput]
        $profiles: [ProfileInput]
      ) {
        createWorkspace(
          image: $image
          name: $name
          domains: $domains
          profiles: $profiles
        ) {
          id
          name
          domains {
            domain
          }
          profiles {
            access
            profile {
              email
            }
          }
          image
          create_date
          update_date
          workspace_key
        }
      }

    `,
    variables,
  };
}

export function generateUpdateWorkspaceRequestPayload(variables: {
  updateWorkspaceId: string;
  image?: string;
  name?: string;
  domains?: { domain: string }[];
  profiles?: {
    access: "ADMIN" | "SUPER_ADMIN" | "TEAM_MEMBER" | "OWNER" | "NONE";
    id: string;
    status:
      | "ACTIVE"
      | "LEFT"
      | "UNSUBSCRIBED"
      | "ABSENCE"
      | "PROHIBITED"
      | "NONE";
    title: string;
  }[];
}) {
  return {
    query: `
      mutation Mutation($updateWorkspaceId: String!, $image: String, $name: String, $domains: [DomainInput], $profiles: [ProfileInput]) {
        updateWorkspace(id: $updateWorkspaceId, image: $image, name: $name, domains: $domains, profiles: $profiles) {
          domains {
            domain
          }
          id
          image
          name
          profiles {
            access
            profile {
              id
              email
              create_date
              image
              login_date
              name
              update_date
            }
            status
            title
          }
          update_date
          workspace_key
          create_date
        }
      }
    `,
    variables,
  };
}

export function generateProfileRegistrationRequestPayload(variables: {
  email: string;
  password: string;
  name: string;
  title?: string;
  headline?: string;
  image?: string;
}) {
  return {
    query: `
      mutation RegisterProfile(
        $email: String!
        $password: String!
        $name: String!
        $title: String
        $headline: String
        $image: String
      ) {
        registerProfile(
          email: $email
          password: $password
          name: $name
          title: $title
          headline: $headline
          image: $image
        ) {
          email
          name
        }
      }
    `,
    variables,
  };
}

export function generateProfileLoginRequestPayload(variables: {
  email: string;
  password: string;
}) {
  return {
    query: `
      mutation Mutation($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          profile {
            create_date
            email
            headline
            id
            image
            is_completed
            login_date
            name
            update_date
            workspace {
              workspace_id
              title
              profile_id
              access
              status
            }
          }
          token
        }
      }

    `,
    variables,
  };
}

export function generateGetProfilesRequestPayload() {
  return {
    query: `
      query GetProfiles {
        getProfiles {
          id
          create_date
          email
          headline
          image
          is_completed
          name
          login_date
          update_date
          workspace {
            access
            profile_id
            status
            title
            workspace {
              id
              image
              name
              update_date
              workspace_key
              create_date
            }
            workspace_id
          }
        }
      }
    `,
  };
}

export function generateDeleteProfileRequestPayload(variables: {
  deleteProfileId: string;
  workspaceId: string;
}) {
  return {
    query: `
      mutation DeleteProfile($deleteProfileId: String!, $workspaceId: String!) {
        deleteProfile(workspace_id: $workspaceId, id: $deleteProfileId) {
          create_date
          email
          headline
          id
          image
          is_completed
          login_date
          name
          update_date
          workspace {
            access
            profile_id
            status
            title
            workspace_id
          }
        }
      }
    `,
    variables,
  };
}

export function generateCreateSlotRequestPayload(variables: {
  type: "ALL" | "SPLIT";
  key: string;
  schedule_date: Date;
  workshop_id: string;
  workspace_id: string;
  ics?: string;
  ics_uid?: string;
}) {
  return {
    query: `
      mutation Mutation(
        $type: SlotType!
        $key: String!
        $schedule_date: Date!
        $workshop_id: String!
        $workspace_id: String!
        $ics: String
        $ics_uid: String
      ) {
        createSlot(
          type: $type
          key: $key
          schedule_date: $schedule_date
          workshop_id: $workshop_id
          workspace_id: $workspace_id
          ics: $ics
          ics_uid: $ics_uid
        ) {
          creator_id
          ics
          ics_uid
          key
          reminder_status
          profile {
            create_date
            email
            headline
            id
            image
            is_completed
            login_date
            name
            update_date
          }
          schedule_date
          status
          type
          workshop_id
          workspace_id
          workspace {
            create_date
            id
            image
            name
            update_date
            workspace_key
          }
        }
      }
    `,
    variables,
  };
}

export function generateGetInvitationRequestPayload(variables: {
  email: string;
  slot_id: string;
}) {
  return {
    query: `
      query GetInvitation($email: String, $slot_id: String) {
        getInvitation(email: $email, slot_id: $slot_id) {
          invitation {
            email
            emails_count
            profile {
              email
              headline
              id
              image
              is_completed
              login_date
              name
              update_date
            }
            profile_id
            slot {
              ics
              ics_uid
              key
              reminder_status
              schedule_date
              status
              type
              workshop_id
              workspace_id
              workspace {
                create_date
                id
                image
                name
                update_date
                workspace_key
              }
              workshop {
                about_text
                about_video
                create_date
                duration
                headline
                id
                status
                topic
                type
                update_date
              }
            }
            slot_id
            status
          }
          millisecondsToStart
        }
      }
    `,
    variables,
  };
}

export function generateCreateInvitationRequestPayload(variables: {
  slot_id: string;
  email: string;
}) {
  return {
    query: `
    mutation CreateInvitation(
      $email: String
      $slot_id: String
    ) {
      createInvitation(
        email: $email
        slot_id: $slot_id
      ) {
        email
        profile {
          create_date
          email
          headline
          id
          image
          is_completed
          login_date
          name
          update_date
        }
        emails_count
        profile_id
        slot {
          creator_id
          ics
          ics_uid
          key
          reminder_status
          schedule_date
          status
          type
          workshop_id
          workspace_id
        }
        slot_id
        status
      }
    }
    `,
    variables,
  };
}

export function generateGetSessionRequestPayload(variables: {
  session_key: string;
}) {
  return {
    query: `
      query Query($session_key: String!) {
        getSession(session_key: $session_key) {
          millisecondsToStart
          session {
            complete_date
            completed_activities
            create_date
            creator_id
            id
            profile {
              create_date
              email
              headline
              id
              image
              is_completed
              login_date
              name
              update_date
            }
            session_key
            slot {
              creator_id
              ics
              ics_uid
              key
              reminder_status
              schedule_date
              status
              type
              workshop {
                about_text
                about_video
                author_id
                create_date
                duration
                headline
                id
                status
                topic
                type
                update_date
              }
              workshop_id
              workspace_id
            }
          }
        }
      }
    `,
    variables,
  };
}

export function generateJoinRequestPayload(variables: { sessionId: string }) {
  return {
    query: `
      mutation Mutation($sessionId: String!) {
        join(sessionId: $sessionId) {
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
    `,
    variables,
  };
}

export function generateReadyToStartPayload(variables: { sessionId: string }) {
  return {
    query: `
      mutation Mutation($sessionId: String!) {
        readyToStart(sessionId: $sessionId) {
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
    `,
    variables,
  };
}

export function generateSetActivityValuePayload(variables: {
  sessionId: string;
  activityId: string;
  value: string;
}) {
  return {
    query: `
      mutation SetActivityValue(
        $sessionId: String!
        $activityId: String!
        $value: String!
      ) {
        setActivityValue(
          sessionId: $sessionId
          activityId: $activityId
          value: $value
        ) {
          context {
            activityResult {
              value {
                key
                value {
                  profileId
                  ready
                  value
                }
              }
              key
            }
            currentActiveProfiles
            lastUpdatedTimestamp
            readyActiveProfiles
          }
          value
        }
      }
    `,
    variables,
  };
}

export function generateSetActivityReadyPayload(variables: {
  sessionId: string;
  activityId: string;
}) {
  return {
    query: `
      mutation SetActivityReady($sessionId: String!, $activityId: String!) {
        setActivityReady(sessionId: $sessionId, activityId: $activityId) {
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
    `,
    variables,
  };
}

export function subscriptionFactory<
  T extends Record<string, unknown> | null | undefined
>(query: string) {
  return function createSubscription(
    variables: T,
    authToken: string,
    collection: any[]
  ) {
    return new Promise<{ client: Client; unsubscribe: () => void }>(
      (res, rej) => {
        let unsubscribe: () => void;
        const client = createSubscriptionClient(authToken, {
          connected: () => res({ client, unsubscribe }),
        });

        unsubscribe = client.subscribe(
          { query, variables },
          {
            next(value) {
              console.log("Subscription next", value);
              collection.push(value);
            },
            error(error) {
              rej(error);
            },
            complete() {},
          }
        );
      }
    );
  };
}

const sessionSubscriptionQuery =
  "subscription Subscription($sessionId: String) {\n  sessionState(sessionId: $sessionId) {\n    context {\n      activityResult {\n        key\n        value {\n          key\n          value {\n            profileId\n            value\n            ready\n          }\n        }\n      }\n      currentActiveProfiles\n      lastUpdatedTimestamp\n      readyActiveProfiles\n    }\n    value\n  }\n}\n";
export const createSessionSubscription = subscriptionFactory<{
  sessionId: string;
}>(sessionSubscriptionQuery);
