import { gql } from "@apollo/client";
import { client } from "../client";
import { LoginResult } from "../types/login-result";

const mutation = gql`
  mutation Mutation($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      profile {
        email
        create_date
        headline
        id
        image
        is_completed
        login_date
        update_date
        name
        workspace {
          access
          profile_id
          status
          title
          workspace_id
        }
      }
      token
    }
  }
`;

export function login(variables: { email: string; password: string }) {
  return client.mutate<LoginResult>({ mutation, variables }).then((result) => {
    if (result.errors) return Promise.reject(result.errors[0]);
    return result.data!.login;
  });
}
