import { gql } from "@apollo/client";
import { client } from "../client";
import { MyProfileResult } from "../types/my-profile-result";

const query = gql`
  query GetMyProfile {
    getMyProfile {
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
`;

export function getMyProfile(variables: { email: string; password: string }) {
  return client.query<MyProfileResult>({ query, variables }).then((result) => {
    if (result.errors) return Promise.reject(result.errors[0]);
    return result.data!.getMyProfile;
  });
}
