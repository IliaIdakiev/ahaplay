import { getUnixTime } from "date-fns";
import {
  apiUrl,
  generateGetInvitationRequestPayload,
  generateGetSessionRequestPayload,
  generateRequestHeaders,
  instance,
  processOperations,
  setupDatabase,
  createSessionSubscription,
  generateJoinRequestPayload,
  delay,
  generateReadyToStartPayload,
  generateSetActivityValuePayload,
  generateSetActivityReadyPayload,
} from "./helpers";
import { expect } from "chai";
import WebSocket from "ws";

async function cleanUp(sessionId: string) {
  await processOperations([
    {
      key: "deleteSessionProcess",
      data: { sessionId },
    },
  ]);
}

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

      const beforeSessionRequestsTimestamp = getUnixTime(new Date());
      const getSessionResponse1 = await instance.post(
        apiUrl,
        generateGetSessionRequestPayload({
          session_key: getInvitation1ResponseData.invitation.slot.key,
        }),
        { headers: generateRequestHeaders({ authToken: authToken1 }) }
      );
      const afterSessionRequestsTimestamp = getUnixTime(new Date());

      const getSessionResponseData =
        getSessionResponse1.data.data.getSession.session;
      const sessionId = getSessionResponseData.id;

      const [sessionProcess] = await processOperations([
        {
          key: "findSessionProcess",
          data: { sessionId },
        },
      ]);

      const user1SubscriptionCollection: any[] = [];
      const user2SubscriptionCollection: any[] = [];
      const user3SubscriptionCollection: any[] = [];

      await createSessionSubscription(
        { sessionId },
        authToken1,
        user1SubscriptionCollection
      );
      await createSessionSubscription(
        { sessionId },
        authToken2,
        user2SubscriptionCollection
      );
      await createSessionSubscription(
        { sessionId },
        authToken3,
        user3SubscriptionCollection
      );

      // PLAYER JOIN
      const join1Response = await instance.post(
        apiUrl,
        generateJoinRequestPayload({
          sessionId,
        }),
        { headers: generateRequestHeaders({ authToken: authToken1 }) }
      );

      const join2Response = await instance.post(
        apiUrl,
        generateJoinRequestPayload({
          sessionId,
        }),
        { headers: generateRequestHeaders({ authToken: authToken2 }) }
      );

      const join3Response = await instance.post(
        apiUrl,
        generateJoinRequestPayload({
          sessionId,
        }),
        { headers: generateRequestHeaders({ authToken: authToken3 }) }
      );

      // PLAYER READY TO START
      const player1ReadyResponse = await instance.post(
        apiUrl,
        generateReadyToStartPayload({
          sessionId,
        }),
        { headers: generateRequestHeaders({ authToken: authToken1 }) }
      );

      const player2ReadyResponse = await instance.post(
        apiUrl,
        generateReadyToStartPayload({
          sessionId,
        }),
        { headers: generateRequestHeaders({ authToken: authToken2 }) }
      );

      const player3ReadyResponse = await instance.post(
        apiUrl,
        generateReadyToStartPayload({
          sessionId,
        }),
        { headers: generateRequestHeaders({ authToken: authToken3 }) }
      );

      // SET START EMOTIONS
      const player1StartEmotionResponse = await instance.post(
        apiUrl,
        generateSetActivityValuePayload({
          sessionId,
          activityId: "startEmotion",
          value: "5",
        }),
        { headers: generateRequestHeaders({ authToken: authToken1 }) }
      );

      const player2StartEmotionResponse = await instance.post(
        apiUrl,
        generateSetActivityValuePayload({
          sessionId,
          activityId: "startEmotion",
          value: "3",
        }),
        { headers: generateRequestHeaders({ authToken: authToken2 }) }
      );

      const player3StartEmotionResponse = await instance.post(
        apiUrl,
        generateSetActivityValuePayload({
          sessionId,
          activityId: "startEmotion",
          value: "6",
        }),
        { headers: generateRequestHeaders({ authToken: authToken3 }) }
      );

      // SET START EMOTIONS READY
      const player1StartEmotionReadyResponse = await instance.post(
        apiUrl,
        generateSetActivityReadyPayload({
          sessionId,
          activityId: "startEmotion",
        }),
        { headers: generateRequestHeaders({ authToken: authToken1 }) }
      );

      const player2StartEmotionReadyResponse = await instance.post(
        apiUrl,
        generateSetActivityReadyPayload({
          sessionId,
          activityId: "startEmotion",
        }),
        { headers: generateRequestHeaders({ authToken: authToken2 }) }
      );

      const player3StartEmotionReadyResponse = await instance.post(
        apiUrl,
        generateSetActivityReadyPayload({
          sessionId,
          activityId: "startEmotion",
        }),
        { headers: generateRequestHeaders({ authToken: authToken3 }) }
      );

      await delay(10000);

      await cleanUp(sessionId);

      const [sessionProcess2] = await processOperations([
        {
          key: "findSessionProcess",
          data: { sessionId },
        },
      ]);

      expect(typeof sessionProcess.id).to.be.equal("number");
      expect(sessionProcess.id).to.be.greaterThan(0);
      expect(sessionProcess2.id).to.be.equal(null);
      expect(getSessionResponseData.create_date).to.be.greaterThanOrEqual(
        beforeSessionRequestsTimestamp
      );
      expect(getSessionResponseData.create_date).to.be.lessThanOrEqual(
        afterSessionRequestsTimestamp
      );
      expect(getSessionResponseData.session_key).to.equal(
        getInvitation1ResponseData.invitation.slot.key
      );
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
