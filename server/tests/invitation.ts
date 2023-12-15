import { add, addMinutes, getUnixTime } from "date-fns";
import {
  apiUrl,
  generateCreateInvitationRequestPayload,
  generateGetInvitationRequestPayload,
  generateRequestHeaders,
  instance,
  setupDatabase,
} from "./helpers";
import { expect } from "chai";
import ms from "ms";

describe("Invitation stuff", () => {
  it("should not find invitation because one was not created", async () => {
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
      const profileResult = setupResult[1];
      const authToken = setupResult[2];
      const slot = setupResult[4];
      const workspace_id = workspaceResult.id;

      const response = await instance.post(
        apiUrl,
        generateGetInvitationRequestPayload({
          email: profileResult.email,
          slot_id: slot.id,
        }),
        { headers: generateRequestHeaders({ authToken }) }
      );

      expect(response.data.data.getInvitation.invitation).to.be.equal(null);
      expect(response.data.data.getInvitation.millisecondsToStart).to.be.equal(
        null
      );
      expect(response.data.errors).to.be.equal(undefined);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("should successfully find invitation not open for session invitation", async () => {
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
            schedule_date,
            creator_id: ["1", "id"],
            workshop_id: ["3", "0", "id"],
            workspace_id: ["0", "id"],
            ics: "",
            ics_uid: "",
            status: "SCHEDULED",
            reminder_status: "NONE",
          },
        },
      ]);
      const workspaceResult = setupResult[0];
      const profileResult = setupResult[1];
      const authToken = setupResult[2];
      const slot = setupResult[4];
      const workspace_id = workspaceResult.id;

      const createInvitationResponse = await instance.post(
        apiUrl,
        generateCreateInvitationRequestPayload({
          email: profileResult.email,
          slot_id: slot.id,
        }),
        { headers: generateRequestHeaders({ authToken }) }
      );

      const getInvitationResponse = await instance.post(
        apiUrl,
        generateGetInvitationRequestPayload({
          email: profileResult.email,
          slot_id: slot.id,
        }),
        { headers: generateRequestHeaders({ authToken }) }
      );

      const createInvitationData =
        createInvitationResponse.data.data.createInvitation;
      const getInvitationData = getInvitationResponse.data.data.getInvitation;

      expect(createInvitationData.email).to.be.equal(profileResult.email);
      expect(createInvitationData.emails_count).to.be.equal(0);
      expect(createInvitationData.profile_id).to.be.equal(profileResult.id);
      expect(createInvitationData.slot_id).to.be.equal(slot.id);
      expect(createInvitationData.status).to.be.equal("PENDING");

      expect(getInvitationData.invitation.id).to.be.deep.equal(
        createInvitationData.id
      );

      expect(getInvitationData.millisecondsToStart).to.be.deep.equal(null);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("should successfully find invitation with ALL slot open for session invitation", async () => {
    try {
      const schedule_date = add(new Date(), { minutes: 15 });

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
            schedule_date,
            creator_id: ["1", "id"],
            workshop_id: ["3", "0", "id"],
            workspace_id: ["0", "id"],
            ics: "",
            ics_uid: "",
            status: "SCHEDULED",
            reminder_status: "NONE",
          },
        },
      ]);
      const workspaceResult = setupResult[0];
      const profileResult = setupResult[1];
      const authToken = setupResult[2];
      const slot = setupResult[4];
      const workspace_id = workspaceResult.id;

      const createInvitationResponse = await instance.post(
        apiUrl,
        generateCreateInvitationRequestPayload({
          email: profileResult.email,
          slot_id: slot.id,
        }),
        { headers: generateRequestHeaders({ authToken }) }
      );

      const getInvitationResponse = await instance.post(
        apiUrl,
        generateGetInvitationRequestPayload({
          email: profileResult.email,
          slot_id: slot.id,
        }),
        { headers: generateRequestHeaders({ authToken }) }
      );

      const createInvitationData =
        createInvitationResponse.data.data.createInvitation;
      const getInvitationData = getInvitationResponse.data.data.getInvitation;

      expect(createInvitationData.email).to.be.equal(profileResult.email);
      expect(createInvitationData.emails_count).to.be.equal(0);
      expect(createInvitationData.profile_id).to.be.equal(profileResult.id);
      expect(createInvitationData.slot_id).to.be.equal(slot.id);
      expect(createInvitationData.status).to.be.equal("PENDING");

      expect(getInvitationData.invitation.id).to.be.deep.equal(
        createInvitationData.id
      );

      expect(getInvitationData.millisecondsToStart).to.be.deep.equal(0);

      expect(getInvitationData.invitation.slot.type).to.be.equal(slot.type);
      expect(
        parseInt(getInvitationData.invitation.slot.key.split("-").pop())
      ).to.equal(getUnixTime(schedule_date));
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("should successfully find invitation with SPLIT slot open for session invitation", async () => {
    try {
      const schedule_date = add(new Date(), { minutes: 15 });

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
            type: "SPLIT",
            schedule_date,
            creator_id: ["1", "id"],
            workshop_id: ["3", "0", "id"],
            workspace_id: ["0", "id"],
            ics: "",
            ics_uid: "",
            status: "SCHEDULED",
            reminder_status: "NONE",
          },
        },
      ]);
      const workspaceResult = setupResult[0];
      const profileResult = setupResult[1];
      const authToken = setupResult[2];
      const slot = setupResult[4];
      const workspace_id = workspaceResult.id;

      const createInvitationResponse = await instance.post(
        apiUrl,
        generateCreateInvitationRequestPayload({
          email: profileResult.email,
          slot_id: slot.id,
        }),
        { headers: generateRequestHeaders({ authToken }) }
      );

      const getInvitationResponse = await instance.post(
        apiUrl,
        generateGetInvitationRequestPayload({
          email: profileResult.email,
          slot_id: slot.id,
        }),
        { headers: generateRequestHeaders({ authToken }) }
      );

      const createInvitationData =
        createInvitationResponse.data.data.createInvitation;
      const getInvitationData = getInvitationResponse.data.data.getInvitation;

      expect(createInvitationData.email).to.be.equal(profileResult.email);
      expect(createInvitationData.emails_count).to.be.equal(0);
      expect(createInvitationData.profile_id).to.be.equal(profileResult.id);
      expect(createInvitationData.slot_id).to.be.equal(slot.id);
      expect(createInvitationData.status).to.be.equal("PENDING");

      expect(getInvitationData.invitation.id).to.be.deep.equal(
        createInvitationData.id
      );

      expect(getInvitationData.millisecondsToStart).to.be.deep.equal(ms("5m"));

      expect(getInvitationData.invitation.slot.type).to.be.equal(slot.type);

      const startTime = getUnixTime(addMinutes(schedule_date, 5));
      expect(
        parseInt(getInvitationData.invitation.slot.key.split("-").pop())
      ).to.equal(startTime);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
