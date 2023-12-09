export const apiUrl = "https://localhost/graphql";

export function generateRequestHeaders(config?: { origin?: string }) {
  return {
    Authorization:
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQwOWM4YWVjLWY3ZTYtNDBjZi05ZDNmLWMwOTUwNzQ3MjJjNiIsIm5hbWUiOiJUZXN0IFRva2VuIDEiLCJlbWFpbCI6InVzZXIxQGFoYXBsYXkuY29tIiwiaW1hZ2UiOiIiLCJhY3RpdmVfd29ya3NwYWNlX2lkIjoiMzBiOGU2Y2UtY2YyMC00ZDdjLTg4MzYtMzFlMjQ0NzQ1ZmZkIiwiaWF0IjoxNjk4NTcyNTA0LCJpc3MiOiJhaGFwbGF5In0.D8cRdizWVx6_nb3yOXnH7TG2ykmPAaMyrG4ersee3P0",
    Origin: config?.origin || "localhost",
  };
}

export function generateUserCreationRequestPayload(variables: {
  email: string;
  name: string;
  password: string;
  headline?: string;
  image?: string;
}) {
  return {
    query: `
    mutation CreateProfile(
      $workspaces: [WorkspaceProfileInput]
      $email: String!
      $name: String!
      $password: String!
      $headline: String
      $image: String
    ) {
      createProfile(
        workspaces: $workspaces
        email: $email
        name: $name
        password: $password
        headline: $headline
        image: $image
      ) {
        create_date
        email
        headline
        id
        image
        is_completed
        name
        update_date
        workspaces {
          access
          profile_id
          status
          title
          workspace {
            name
            workspace_key
          }
        }
      }
    }`,
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
  name: string;
  password: string;
}) {
  return {
    query: `
      mutation Mutation($email: String!, $name: String!, $password: String!) {
        registerProfile(email: $email, name: $name, password: $password) {
          create_date
          email
          headline
          id
          image
          is_completed
          login_date
          name
          update_date
          workspaces {
            title
            workspace_id
          }
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
            workspaces {
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
          workspaces {
            access
            profile_id
            status
            title
            workspace_id
          }
        }
      }
    `,
  };
}
