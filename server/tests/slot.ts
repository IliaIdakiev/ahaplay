import { add } from "date-fns";
import {
  apiUrl,
  generateCreateSlotRequestPayload,
  generateRequestHeaders,
  instance,
  setupDatabase,
} from "./helpers";
import { expect } from "chai";

// TODO: Add more slot tests

describe("(Client account) Slot", () => {
  it("should schedule a ALL slot", async () => {
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
      ]);

      const workspace = setupResult[0];
      const profile = setupResult[1];
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

      expect(responseData.creator_id).to.be.equal(profile.id);
      expect(responseData.key).to.be.equal(key);
      expect(responseData.reminder_status).to.equal("NONE");
      expect(responseData.type).to.be.equal(type);
      expect(responseData.status).to.be.equal("SCHEDULED");
      expect(responseData.workshop_id).to.be.equal(workshop_id);
      expect(responseData.workspace_id).to.be.equal(workspace_id);
      expect(responseData.ics).to.be.equal(ics);
      expect(responseData.ics_uid).to.be.equal(ics_uid);
      expect(responseErrors).to.be.equal(undefined);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
  it("should schedule a SPLIT slot", async () => {
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
      ]);

      const workspace = setupResult[0];
      const profile = setupResult[1];
      const authToken = setupResult[2];
      const workshops = setupResult[3];

      const type = "SPLIT" as const;
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

      expect(responseData.creator_id).to.be.equal(profile.id);
      expect(responseData.key).to.be.equal(key);
      expect(responseData.reminder_status).to.equal("NONE");
      expect(responseData.type).to.be.equal(type);
      expect(responseData.status).to.be.equal("SCHEDULED");
      expect(responseData.workshop_id).to.be.equal(workshop_id);
      expect(responseData.workspace_id).to.be.equal(workspace_id);
      expect(responseData.ics).to.be.equal(ics);
      expect(responseData.ics_uid).to.be.equal(ics_uid);
      expect(responseErrors).to.be.equal(undefined);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
  it("should schedule a SPLIT slot FOR MY WORKSPACE even if another workspace id is passed", async () => {
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
          key: "createWorkspace",
          data: { name: "My test other workspace", domains: ["best.com"] },
        },
      ]);

      const workspace = setupResult[0];
      const profile = setupResult[1];
      const authToken = setupResult[2];
      const workshops = setupResult[3];
      const otherWorkspace = setupResult[4];

      const type = "SPLIT" as const;
      const key = "ALA_BALA";
      const schedule_date = add(new Date(), { hours: 1 });
      const workshop_id = workshops[0].id;
      const workspace_id = otherWorkspace.id;
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

      expect(responseData.creator_id).to.be.equal(profile.id);
      expect(responseData.key).to.be.equal(key);
      expect(responseData.reminder_status).to.equal("NONE");
      expect(responseData.type).to.be.equal(type);
      expect(responseData.status).to.be.equal("SCHEDULED");
      expect(responseData.workshop_id).to.be.equal(workshop_id);
      expect(responseData.workspace_id).to.be.equal(workspace.id);
      expect(responseData.ics).to.be.equal(ics);
      expect(responseData.ics_uid).to.be.equal(ics_uid);
      expect(responseErrors).to.be.equal(undefined);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
