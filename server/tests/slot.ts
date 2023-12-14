import { add } from "date-fns";
import {
  apiUrl,
  generateCreateSlotRequestPayload,
  generateRequestHeaders,
  instance,
  setupDatabase,
} from "./helpers";

describe("(Client account) Slot", () => {
  it.only("should schedule a ALL slot", async () => {
    try {
      const setupResult = await setupDatabase([
        {
          key: "createWorkspace",
          data: { name: "My test workspace", domains: ["test.com"] },
        },
        {
          key: "createProfile",
          data: {
            name: "Test profile",
            email: "test@test.com",
            workspace_id: "[0].id",
            access: "OWNER",
            status: "ACTIVE",
            is_completed: true,
          },
        },
        {
          key: "getAuthToken",
          data: {
            email: "[1].email",
          },
        },
        {
          key: "getWorkshops",
          data: {},
        },
      ]);

      const workspace = setupResult[0];
      const authToken = setupResult[2];
      const workshops = setupResult[3];

      const type = "ALL" as const;
      const key = "ALA_BALA";
      const schedule_date = add(new Date(), { hours: 1 });
      const workshop_id = workshops[0].id;
      const workspace_id = workspace.id;
      const ics = "";
      const ics_uid = "";

      const response = await instance.post(
        apiUrl,
        generateCreateSlotRequestPayload({
          type,
          key,
          schedule_date,
          workshop_id,
          workspace_id,
          ics,
          ics_uid,
        }),
        { headers: generateRequestHeaders({ authToken }) }
      );

      const responseData = response.data.data.createSlot;
      const responseErrors = response.data.errors;
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
