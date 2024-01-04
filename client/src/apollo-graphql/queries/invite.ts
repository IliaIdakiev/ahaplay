import { gql } from "@apollo/client";
import { client } from "../client";
import { InvitationResult } from "../types/invite-result";

const query = gql`
  query GetInvitation($email: String, $slotId: String) {
    getInvitation(email: $email, slot_id: $slotId) {
      invitation {
        email
        emails_count
        profile_id
        slot_id
        status
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
          workshop {
            about_text
            about_video
            author_id
            create_date
            duration
            headline
            id
            topic
            status
            type
            update_date
            activities {
              description
              sequence_number
              type
              answers {
                activity_id
                create_date
                explanation_text
                id
                points
                text
                update_date
              }
              assignment {
                activity_id
                duration
                conceptualization_id
                text
                video
              }
              benchmark {
                activity_id
                baseline
                conceptualization_id
                g_duration
                i_duration
                reference
              }
              concepts {
                activity_id
                create_date
                id
                name
                sequence_number
                text
                update_date
              }
              conceptualization {
                activity_id
                concept
                g_duration
                i_duration
                instructions
              }
              question {
                activity_id
                assignment_id
                g_duration
                i_duration
                text
                theory_id
              }
              theory {
                activity_id
                conceptualization_id
                duration
                video
              }
            }
          }
        }
      }
      millisecondsToStart
    }
  }
`;

export function getInvitation(variables: { email: string; slotId: string }) {
  return client.query<InvitationResult>({ query, variables }).then((result) => {
    if (result.errors) return Promise.reject(result.errors[0]);
    return result.data!.getInvitation;
  });
}
