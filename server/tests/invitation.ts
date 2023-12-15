import { add } from "date-fns";
import { setupDatabase } from "./helpers";

describe("(Master account) Profile actions", () => {
  it("should successfully create one profile", async () => {
    try {
      const schedule_date = add(new Date(), { hours: 1 });

      const setupResult = await setupDatabase([
        {
          key: "createWorkspace",
          data: { name: "My test workspace", domains: ["ahaplay.com"] },
        },
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
        {
          key: "getAuthToken",
          data: {
            email: ["1", "email"],
          },
        },
        {
          key: "getWorkshops",
          data: {},
        },
        {
          key: "createSlot",
          data: {
            type: "ALL",
            key: "SECRET_KEY",
            schedule_date,
            creator_id: ["1", "id"],
            workshop_id: ["3", "0", "id"],
            workspace_id: ["0", "id"],
            ics: "",
            ics_uid: "",
            reminder_status: "SCHEDULED",
            status: "NONE",
          },
        },
      ]);
      const workspaceResult = setupResult[0];
      const authToken = setupResult[2];
      const slot = setupResult[4];
      const workspace_id = workspaceResult.id;

      // const email = "email@email.com";
      // const name = "Test user";
      // const password = "123";
      // const workspaceProfileData = {
      //   status: "ACTIVE" as const,
      //   access: "TEAM_MEMBER" as const,
      //   title: "",
      // };

      // const beforeRequestTimestamp = getUnixTime(new Date());
      // const response = await instance.post(
      //   apiUrl,
      //   generateUserCreationRequestPayload({
      //     workspace_id,
      //     email,
      //     name,
      //     password,
      //     workspace: workspaceProfileData,
      //   }),
      //   { headers: generateRequestHeaders({ authToken }) }
      // );
      // const afterRequestTimestamp = getUnixTime(new Date());
      // const responseData = response.data.data.createProfile;
      // const responseErrors = response.data.errors;
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
