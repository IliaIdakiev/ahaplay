import { gql } from "@apollo/client";
import { client } from "../client";
import { SessionResult } from "../types/session-result";

const queryWithSlotAndWorkshop = gql`
  query Query($sessionKey: String!) {
    getSession(session_key: $sessionKey) {
      millisecondsToStart
      session {
        complete_date
        completed_activities
        create_date
        creator_id
        id
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
            activities {
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
                conceptualization_id
                duration
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
              description
              question {
                activity_id
                assignment_id
                g_duration
                i_duration
                text
                theory_id
              }
              sequence_number
              theory {
                activity_id
                conceptualization_id
                duration
                video
              }
              type
              workshop_id
            }
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
`;

const query = gql`
  query Query($sessionKey: String!) {
    getSession(session_key: $sessionKey) {
      millisecondsToStart
      session {
        complete_date
        completed_activities
        create_date
        creator_id
        id
        session_key
      }
    }
  }
`;

export function getSession(variables: {
  sessionKey: string;
  includeSlotAndWorkshop: boolean;
}) {
  const { includeSlotAndWorkshop, ...queryVariables } = variables;
  return client
    .query<SessionResult>({
      query: includeSlotAndWorkshop ? queryWithSlotAndWorkshop : query,
      variables: queryVariables,
    })
    .then((result) => {
      if (result.errors) return Promise.reject(result.errors[0]);
      return result.data!.getSession;
    });
}
