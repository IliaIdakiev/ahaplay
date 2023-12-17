import { add } from "date-fns";
import {
  apiUrl,
  generateGetInvitationRequestPayload,
  generateGetSessionRequestPayload,
  generateRequestHeaders,
  instance,
  setupDatabase,
} from "./helpers";

describe("Session stuff", () => {
  it.only("should start session for ALL slot", async () => {
    try {
      const schedule_date = new Date();

      const setupResult = await setupDatabase([
        // 0
        {
          key: "createWorkspace",
          data: { name: "My test workspace", domains: ["ahaplay.com"] },
        },
        // 1
        {
          key: "createProfile",
          data: {
            name: "Test profile",
            email: "test@ahaplay.com",
            workspace_id: ["0", "id"],
            access: "OWNER",
            status: "ACTIVE",
            is_completed: true,
          },
        },
        // 2
        {
          key: "createProfile",
          data: {
            name: "Test profile 2",
            email: "test-2@ahaplay.com",
            workspace_id: ["0", "id"],
            access: "TEAM_MEMBER",
            status: "ACTIVE",
            is_completed: true,
          },
        },
        // 3
        {
          key: "createProfile",
          data: {
            name: "Test profile 3",
            email: "test-3@ahaplay.com",
            workspace_id: ["0", "id"],
            access: "TEAM_MEMBER",
            status: "ACTIVE",
            is_completed: true,
          },
        },
        // 4
        {
          key: "getAuthToken",
          data: {
            email: ["1", "email"],
          },
        },
        // 5
        {
          key: "getAuthToken",
          data: {
            email: ["2", "email"],
          },
        },
        // 6
        {
          key: "getAuthToken",
          data: {
            email: ["3", "email"],
          },
        },
        // 7
        {
          key: "getWorkshops",
          data: {},
        },
        // 8
        {
          key: "createSlot",
          data: {
            type: "ALL",
            schedule_date,
            creator_id: ["1", "id"],
            workshop_id: ["7", "0", "id"],
            workspace_id: ["0", "id"],
            ics: "",
            ics_uid: "",
            status: "SCHEDULED",
            reminder_status: "NONE",
          },
        },
        // 9
        {
          key: "createInvite",
          data: {
            email: ["1", "email"],
            status: "ACCEPTED",
            profile_id: ["1", "id"],
            slot_id: ["8", "id"],
          },
        },
        // 10
        {
          key: "createInvite",
          data: {
            email: ["2", "email"],
            status: "ACCEPTED",
            profile_id: ["2", "id"],
            slot_id: ["8", "id"],
          },
        },
        // 11
        {
          key: "createInvite",
          data: {
            email: ["3", "email"],
            status: "ACCEPTED",
            profile_id: ["3", "id"],
            slot_id: ["8", "id"],
          },
        },
      ]);

      const authToken1 = setupResult[4];
      const authToken2 = setupResult[5];
      const authToken3 = setupResult[6];

      const inviteUser1 = setupResult[9];
      const inviteUser2 = setupResult[10];
      const inviteUser3 = setupResult[11];

      const getInvitationResponse1 = await instance.post(
        apiUrl,
        generateGetInvitationRequestPayload({
          email: inviteUser1.email,
          slot_id: inviteUser1.slot_id,
        }),
        { headers: generateRequestHeaders({ authToken: authToken1 }) }
      );
      const getInvitation1ResponseData =
        getInvitationResponse1.data.data.getInvitation;

      const getInvitationResponse2 = await instance.post(
        apiUrl,
        generateGetInvitationRequestPayload({
          email: inviteUser2.email,
          slot_id: inviteUser2.slot_id,
        }),
        { headers: generateRequestHeaders({ authToken: authToken2 }) }
      );

      const getInvitation2ResponseData =
        getInvitationResponse2.data.data.getInvitation;

      const getInvitationResponse3 = await instance.post(
        apiUrl,
        generateGetInvitationRequestPayload({
          email: inviteUser3.email,
          slot_id: inviteUser3.slot_id,
        }),
        { headers: generateRequestHeaders({ authToken: authToken3 }) }
      );

      const getInvitation3ResponseData =
        getInvitationResponse3.data.data.getInvitation;

      const getSessionResponse1 = await instance.post(
        apiUrl,
        generateGetSessionRequestPayload({
          session_key: getInvitation1ResponseData.invitation.slot.key,
        }),
        { headers: generateRequestHeaders({ authToken: authToken1 }) }
      );

      console.log(getSessionResponse1);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
