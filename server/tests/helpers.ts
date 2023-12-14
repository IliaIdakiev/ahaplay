import * as https from "https";
import axios from "axios";

export const serverUrl = `https://localhost`;
export const apiUrl = `${serverUrl}/graphql`;
// const masterAuthorizationToken =
// "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQwOWM4YWVjLWY3ZTYtNDBjZi05ZDNmLWMwOTUwNzQ3MjJjNiIsIm5hbWUiOiJUZXN0IFRva2VuIDEiLCJlbWFpbCI6InVzZXIxQGFoYXBsYXkuY29tIiwiaW1hZ2UiOiIiLCJhY3RpdmVfd29ya3NwYWNlX2lkIjoiMzBiOGU2Y2UtY2YyMC00ZDdjLTg4MzYtMzFlMjQ0NzQ1ZmZkIiwiaWF0IjoxNjk4NTcyNTA0LCJpc3MiOiJhaGFwbGF5In0.D8cRdizWVx6_nb3yOXnH7TG2ykmPAaMyrG4ersee3P0";

export const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

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
            workspace {
              access
              profile_id
              status
              title
              workspace_id
            }
          }
          schedule_date
          status
          type
          workshop_id
          workspace_id
          workspace {
            create_date
            domains {
              domain
            }
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
