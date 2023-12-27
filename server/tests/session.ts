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
  it("should start session for ALL slot", async () => {
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

      const workshop = setupResult[7][0];
      const workshopActivities = workshop.activities.sort(
        (a: any, b: any) => a.sequence_number - b.sequence_number
      );

      const inviteUser1 = setupResult[9];
      const inviteUser2 = setupResult[10];
      const inviteUser3 = setupResult[11];

      const beforeSessionRequestsTimestamp = getUnixTime(new Date());
      const [
        [getInvitationResponse1, getSessionResponse1],
        [getInvitationResponse2, getSessionResponse2],
        [getInvitationResponse3, getSessionResponse3],
      ] = await Promise.all([
        instance
          .post(
            apiUrl,
            generateGetInvitationRequestPayload({
              email: inviteUser1.email,
              slot_id: inviteUser1.slot_id,
            }),
            { headers: generateRequestHeaders({ authToken: authToken1 }) }
          )
          .then((result1) =>
            instance
              .post(
                apiUrl,
                generateGetSessionRequestPayload({
                  session_key:
                    result1.data.data.getInvitation.invitation.slot.key,
                }),
                { headers: generateRequestHeaders({ authToken: authToken1 }) }
              )
              .then((result2) => [result1, result2])
          ),
        instance
          .post(
            apiUrl,
            generateGetInvitationRequestPayload({
              email: inviteUser2.email,
              slot_id: inviteUser2.slot_id,
            }),
            { headers: generateRequestHeaders({ authToken: authToken2 }) }
          )
          .then((result1) =>
            instance
              .post(
                apiUrl,
                generateGetSessionRequestPayload({
                  session_key:
                    result1.data.data.getInvitation.invitation.slot.key,
                }),
                { headers: generateRequestHeaders({ authToken: authToken2 }) }
              )
              .then((result2) => [result1, result2])
          ),
        instance
          .post(
            apiUrl,
            generateGetInvitationRequestPayload({
              email: inviteUser3.email,
              slot_id: inviteUser3.slot_id,
            }),
            { headers: generateRequestHeaders({ authToken: authToken3 }) }
          )
          .then((result1) =>
            instance
              .post(
                apiUrl,
                generateGetSessionRequestPayload({
                  session_key:
                    result1.data.data.getInvitation.invitation.slot.key,
                }),
                { headers: generateRequestHeaders({ authToken: authToken3 }) }
              )
              .then((result2) => [result1, result2])
          ),
        ,
      ]);

      const afterSessionRequestsTimestamp = getUnixTime(new Date());

      const getInvitation1ResponseData =
        getInvitationResponse1.data.data.getInvitation;

      const getInvitation2ResponseData =
        getInvitationResponse2.data.data.getInvitation;

      const getInvitation3ResponseData =
        getInvitationResponse3.data.data.getInvitation;

      const getSession1ResponseData =
        getSessionResponse1.data.data.getSession.session;
      const getSession2ResponseData =
        getSessionResponse2.data.data.getSession.session;
      const getSession3ResponseData =
        getSessionResponse3.data.data.getSession.session;

      const sessionId = getSession1ResponseData.id;
      const [sessionProcess] = await processOperations([
        {
          key: "findSessionProcess",
          data: { sessionId },
        },
      ]);

      const user1SubscriptionCollection: any[] = [];
      const user2SubscriptionCollection: any[] = [];
      const user3SubscriptionCollection: any[] = [];

      createSessionSubscription(
        { sessionId },
        authToken1,
        user1SubscriptionCollection
      );
      createSessionSubscription(
        { sessionId },
        authToken2,
        user2SubscriptionCollection
      );
      createSessionSubscription(
        { sessionId },
        authToken3,
        user3SubscriptionCollection
      );

      // PLAYER JOIN
      const [
        [join1Response, player1ReadyResponse],
        [join2Response, player2ReadyResponse],
        [join3Response, player3ReadyResponse],
      ] = await Promise.all([
        instance
          .post(
            apiUrl,
            generateJoinRequestPayload({
              sessionId,
            }),
            { headers: generateRequestHeaders({ authToken: authToken1 }) }
          )
          .then((result1) => {
            return instance
              .post(
                apiUrl,
                generateReadyToStartPayload({
                  sessionId,
                }),
                { headers: generateRequestHeaders({ authToken: authToken1 }) }
              )
              .then((result2) => [result1, result2]);
          }),
        instance
          .post(
            apiUrl,
            generateJoinRequestPayload({
              sessionId,
            }),
            { headers: generateRequestHeaders({ authToken: authToken2 }) }
          )
          .then((result1) => {
            return instance
              .post(
                apiUrl,
                generateReadyToStartPayload({
                  sessionId,
                }),
                { headers: generateRequestHeaders({ authToken: authToken2 }) }
              )
              .then((result2) => [result1, result2]);
          }),
        instance
          .post(
            apiUrl,
            generateJoinRequestPayload({
              sessionId,
            }),
            { headers: generateRequestHeaders({ authToken: authToken3 }) }
          )
          .then((result1) => {
            return instance
              .post(
                apiUrl,
                generateReadyToStartPayload({
                  sessionId,
                }),
                { headers: generateRequestHeaders({ authToken: authToken3 }) }
              )
              .then((result2) => [result1, result2]);
          }),
      ]);

      // SET START EMOTIONS

      const [
        [player1StartEmotionResponse, player1StartEmotionReadyResponse],
        [player2StartEmotionResponse, player3StartEmotionResponse],
        [player2StartEmotionReadyResponse, player3StartEmotionReadyResponse],
      ] = await Promise.all([
        instance
          .post(
            apiUrl,
            generateSetActivityValuePayload({
              sessionId,
              activityId: "startEmotion",
              value: "5",
            }),
            { headers: generateRequestHeaders({ authToken: authToken1 }) }
          )
          .then((result1) =>
            instance
              .post(
                apiUrl,
                generateSetActivityReadyPayload({
                  sessionId,
                  activityId: "startEmotion",
                }),
                { headers: generateRequestHeaders({ authToken: authToken1 }) }
              )
              .then((result2) => [result1, result2])
          ),
        instance
          .post(
            apiUrl,
            generateSetActivityValuePayload({
              sessionId,
              activityId: "startEmotion",
              value: "3",
            }),
            { headers: generateRequestHeaders({ authToken: authToken2 }) }
          )
          .then((result1) =>
            instance
              .post(
                apiUrl,
                generateSetActivityReadyPayload({
                  sessionId,
                  activityId: "startEmotion",
                }),
                { headers: generateRequestHeaders({ authToken: authToken2 }) }
              )
              .then((result2) => [result1, result2])
          ),
        instance
          .post(
            apiUrl,
            generateSetActivityValuePayload({
              sessionId,
              activityId: "startEmotion",
              value: "6",
            }),
            { headers: generateRequestHeaders({ authToken: authToken3 }) }
          )
          .then((result1) =>
            instance
              .post(
                apiUrl,
                generateSetActivityReadyPayload({
                  sessionId,
                  activityId: "startEmotion",
                }),
                { headers: generateRequestHeaders({ authToken: authToken3 }) }
              )
              .then((result2) => [result1, result2])
          ),
      ]);

      // SET TEAM NAME
      const [
        player1SetTeamNameResponse,
        player2SetTeamNameResponse,
        player3SetTeamNameResponse,
      ] = await Promise.all([
        instance.post(
          apiUrl,
          generateSetActivityValuePayload({
            sessionId,
            activityId: "teamName",
            value: "The",
          }),
          { headers: generateRequestHeaders({ authToken: authToken1 }) }
        ),
        instance.post(
          apiUrl,
          generateSetActivityValuePayload({
            sessionId,
            activityId: "teamName",
            value: "Team",
          }),
          { headers: generateRequestHeaders({ authToken: authToken2 }) }
        ),
        instance.post(
          apiUrl,
          generateSetActivityValuePayload({
            sessionId,
            activityId: "teamName",
            value: "Is Cool",
          }),
          { headers: generateRequestHeaders({ authToken: authToken3 }) }
        ),
      ]);

      // SET SET TEAM NAME READY
      const [
        player1TeamNameReadyResponse,
        player2TeamNameReadyResponse,
        player3TeamNameReadyResponse,
      ] = await Promise.all([
        instance.post(
          apiUrl,
          generateSetActivityReadyPayload({
            sessionId,
            activityId: "teamName",
          }),
          { headers: generateRequestHeaders({ authToken: authToken1 }) }
        ),
        instance.post(
          apiUrl,
          generateSetActivityReadyPayload({
            sessionId,
            activityId: "teamName",
          }),
          { headers: generateRequestHeaders({ authToken: authToken2 }) }
        ),
        instance.post(
          apiUrl,
          generateSetActivityReadyPayload({
            sessionId,
            activityId: "teamName",
          }),
          { headers: generateRequestHeaders({ authToken: authToken3 }) }
        ),
      ]);

      let previousActivityId = null;
      for (let i = 0; i < workshopActivities.length + 1; i++) {
        const lastSocketValues = [
          user1SubscriptionCollection[user1SubscriptionCollection.length - 1],
          user2SubscriptionCollection[user2SubscriptionCollection.length - 1],
          user3SubscriptionCollection[user3SubscriptionCollection.length - 1],
        ].sort(
          (a, b) =>
            a.data.sessionState.context.lastUpdatedTimestamp -
            b.data.sessionState.context.lastUpdatedTimestamp
        );
        const value = lastSocketValues[0].data.sessionState.value;

        if (value.includes(previousActivityId)) {
          --i;
        }
        if (value.includes("endEmotion")) {
          break;
        }
        const activity = workshopActivities[i];

        if (!value.includes("review")) {
          // SET ACTIVITY VALUE
          const [
            [player1SetActivityValueResponse, player1SetReadyResponse],
            [player2SetActivityValueResponse, player2SetReadyResponse],
            [player3SetActivityValueResponse, player3SetReadyResponse],
          ] = await Promise.all([
            instance
              .post(
                apiUrl,
                generateSetActivityValuePayload({
                  sessionId,
                  activityId: activity.id,
                  value: "test value 1",
                }),
                { headers: generateRequestHeaders({ authToken: authToken1 }) }
              )
              .then((result1) =>
                instance
                  .post(
                    apiUrl,
                    generateSetActivityReadyPayload({
                      sessionId,
                      activityId: activity.id,
                    }),
                    {
                      headers: generateRequestHeaders({
                        authToken: authToken1,
                      }),
                    }
                  )
                  .then((result2) => [result1, result2])
              ),
            instance
              .post(
                apiUrl,
                generateSetActivityValuePayload({
                  sessionId,
                  activityId: activity.id,
                  value: "test value 2",
                }),
                { headers: generateRequestHeaders({ authToken: authToken2 }) }
              )
              .then((result1) =>
                instance
                  .post(
                    apiUrl,
                    generateSetActivityReadyPayload({
                      sessionId,
                      activityId: activity.id,
                    }),
                    {
                      headers: generateRequestHeaders({
                        authToken: authToken2,
                      }),
                    }
                  )
                  .then((result2) => [result1, result2])
              ),
            instance
              .post(
                apiUrl,
                generateSetActivityValuePayload({
                  sessionId,
                  activityId: activity.id,
                  value: "test value 3",
                }),
                { headers: generateRequestHeaders({ authToken: authToken3 }) }
              )
              .then((result1) =>
                instance
                  .post(
                    apiUrl,
                    generateSetActivityReadyPayload({
                      sessionId,
                      activityId: activity.id,
                    }),
                    {
                      headers: generateRequestHeaders({
                        authToken: authToken3,
                      }),
                    }
                  )
                  .then((result2) => [result1, result2])
              ),
          ]);
        } else {
          // SET ACTIVITY READY
          const [
            player1ActivityReady,
            player2ActivityReady,
            player3ActivityReady,
          ] = await Promise.all([
            instance.post(
              apiUrl,
              generateSetActivityReadyPayload({
                sessionId,
                activityId: activity.id,
              }),
              { headers: generateRequestHeaders({ authToken: authToken1 }) }
            ),
            instance.post(
              apiUrl,
              generateSetActivityReadyPayload({
                sessionId,
                activityId: activity.id,
              }),
              { headers: generateRequestHeaders({ authToken: authToken2 }) }
            ),
            instance.post(
              apiUrl,
              generateSetActivityReadyPayload({
                sessionId,
                activityId: activity.id,
              }),
              { headers: generateRequestHeaders({ authToken: authToken3 }) }
            ),
          ]);
        }

        previousActivityId = activity.id;
      }

      // SET END EMOTIONS
      const [
        [player1EndEmotionResponse, player1EndEmotionReadyResponse],
        [player2EndEmotionResponse, player2EndEmotionReadyResponse],
        [player3EndEmotionResponse, player3EndEmotionReadyResponse],
      ] = await Promise.all([
        instance
          .post(
            apiUrl,
            generateSetActivityValuePayload({
              sessionId,
              activityId: "endEmotion",
              value: "6",
            }),
            { headers: generateRequestHeaders({ authToken: authToken1 }) }
          )
          .then((result1) =>
            instance
              .post(
                apiUrl,
                generateSetActivityReadyPayload({
                  sessionId,
                  activityId: "endEmotion",
                }),
                { headers: generateRequestHeaders({ authToken: authToken1 }) }
              )
              .then((result2) => [result1, result2])
          ),
        instance
          .post(
            apiUrl,
            generateSetActivityValuePayload({
              sessionId,
              activityId: "endEmotion",
              value: "6",
            }),
            { headers: generateRequestHeaders({ authToken: authToken2 }) }
          )
          .then((result1) =>
            instance
              .post(
                apiUrl,
                generateSetActivityReadyPayload({
                  sessionId,
                  activityId: "endEmotion",
                }),
                { headers: generateRequestHeaders({ authToken: authToken2 }) }
              )
              .then((result2) => [result1, result2])
          ),
        instance
          .post(
            apiUrl,
            generateSetActivityValuePayload({
              sessionId,
              activityId: "endEmotion",
              value: "6",
            }),
            { headers: generateRequestHeaders({ authToken: authToken3 }) }
          )
          .then((result1) =>
            instance
              .post(
                apiUrl,
                generateSetActivityReadyPayload({
                  sessionId,
                  activityId: "endEmotion",
                }),
                { headers: generateRequestHeaders({ authToken: authToken3 }) }
              )
              .then((result2) => [result1, result2])
          ),
      ]);

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
      expect(getSession1ResponseData.create_date).to.be.greaterThanOrEqual(
        beforeSessionRequestsTimestamp
      );
      expect(getSession1ResponseData.create_date).to.be.lessThanOrEqual(
        afterSessionRequestsTimestamp
      );
      expect(getSession1ResponseData.session_key).to.equal(
        getInvitation1ResponseData.invitation.slot.key
      );
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
  it.only("should start session for SPLIT slot", async () => {
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
            name: "Test profile 1",
            email: "test-1@ahaplay.com",
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
          key: "createProfile",
          data: {
            name: "Test profile 4",
            email: "test-4@ahaplay.com",
            workspace_id: ["0", "id"],
            access: "OWNER",
            status: "ACTIVE",
            is_completed: true,
          },
        },
        // 5
        {
          key: "createProfile",
          data: {
            name: "Test profile 5",
            email: "test-5@ahaplay.com",
            workspace_id: ["0", "id"],
            access: "TEAM_MEMBER",
            status: "ACTIVE",
            is_completed: true,
          },
        },
        // 6
        {
          key: "createProfile",
          data: {
            name: "Test profile 6",
            email: "test-6@ahaplay.com",
            workspace_id: ["0", "id"],
            access: "TEAM_MEMBER",
            status: "ACTIVE",
            is_completed: true,
          },
        },
        // 7
        {
          key: "getAuthToken",
          data: {
            email: ["1", "email"],
          },
        },
        // 8
        {
          key: "getAuthToken",
          data: {
            email: ["2", "email"],
          },
        },
        // 9
        {
          key: "getAuthToken",
          data: {
            email: ["3", "email"],
          },
        },
        // 10
        {
          key: "getAuthToken",
          data: {
            email: ["4", "email"],
          },
        },
        // 11
        {
          key: "getAuthToken",
          data: {
            email: ["5", "email"],
          },
        },
        // 12
        {
          key: "getAuthToken",
          data: {
            email: ["6", "email"],
          },
        },
        // 13
        {
          key: "getWorkshops",
          data: {},
        },
        // 14
        {
          key: "createSlot",
          data: {
            type: "SPLIT",
            schedule_date,
            creator_id: ["1", "id"],
            workshop_id: ["13", "0", "id"],
            workspace_id: ["0", "id"],
            ics: "",
            ics_uid: "",
            status: "SCHEDULED",
            reminder_status: "NONE",
          },
        },
        // 15
        {
          key: "createInvite",
          data: {
            email: ["1", "email"],
            status: "ACCEPTED",
            profile_id: ["1", "id"],
            slot_id: ["14", "id"],
          },
        },
        // 16
        {
          key: "createInvite",
          data: {
            email: ["2", "email"],
            status: "ACCEPTED",
            profile_id: ["2", "id"],
            slot_id: ["14", "id"],
          },
        },
        // 17
        {
          key: "createInvite",
          data: {
            email: ["3", "email"],
            status: "ACCEPTED",
            profile_id: ["3", "id"],
            slot_id: ["14", "id"],
          },
        },
        // 18
        {
          key: "createInvite",
          data: {
            email: ["4", "email"],
            status: "ACCEPTED",
            profile_id: ["4", "id"],
            slot_id: ["14", "id"],
          },
        },
        // 19
        {
          key: "createInvite",
          data: {
            email: ["5", "email"],
            status: "ACCEPTED",
            profile_id: ["5", "id"],
            slot_id: ["14", "id"],
          },
        },
        // 20
        {
          key: "createInvite",
          data: {
            email: ["6", "email"],
            status: "ACCEPTED",
            profile_id: ["6", "id"],
            slot_id: ["14", "id"],
          },
        },
      ]);

      const authToken1 = setupResult[7];
      const authToken2 = setupResult[8];
      const authToken3 = setupResult[9];
      const authToken4 = setupResult[10];
      const authToken5 = setupResult[11];
      const authToken6 = setupResult[12];

      const workshop = setupResult[13][0];
      const workshopActivities = workshop.activities.sort(
        (a: any, b: any) => a.sequence_number - b.sequence_number
      );

      const inviteUser1 = setupResult[15];
      const inviteUser2 = setupResult[16];
      const inviteUser3 = setupResult[17];
      const inviteUser4 = setupResult[18];
      const inviteUser5 = setupResult[19];
      const inviteUser6 = setupResult[20];

      const beforeSessionRequestsTimestamp = getUnixTime(new Date());
      const [
        [getInvitationResponse1, getSessionResponse1],
        [getInvitationResponse2, getSessionResponse2],
        [getInvitationResponse3, getSessionResponse3],
        [getInvitationResponse4, getSessionResponse4],
        [getInvitationResponse5, getSessionResponse5],
        [getInvitationResponse6, getSessionResponse6],
      ] = await Promise.all([
        instance
          .post(
            apiUrl,
            generateGetInvitationRequestPayload({
              email: inviteUser1.email,
              slot_id: inviteUser1.slot_id,
            }),
            { headers: generateRequestHeaders({ authToken: authToken1 }) }
          )
          .then((result1) =>
            instance
              .post(
                apiUrl,
                generateGetSessionRequestPayload({
                  session_key:
                    result1.data.data.getInvitation.invitation.slot.key,
                }),
                { headers: generateRequestHeaders({ authToken: authToken1 }) }
              )
              .then((result2) => [result1, result2])
          ),
        instance
          .post(
            apiUrl,
            generateGetInvitationRequestPayload({
              email: inviteUser2.email,
              slot_id: inviteUser2.slot_id,
            }),
            { headers: generateRequestHeaders({ authToken: authToken2 }) }
          )
          .then((result1) =>
            instance
              .post(
                apiUrl,
                generateGetSessionRequestPayload({
                  session_key:
                    result1.data.data.getInvitation.invitation.slot.key,
                }),
                { headers: generateRequestHeaders({ authToken: authToken2 }) }
              )
              .then((result2) => [result1, result2])
          ),
        instance
          .post(
            apiUrl,
            generateGetInvitationRequestPayload({
              email: inviteUser3.email,
              slot_id: inviteUser3.slot_id,
            }),
            { headers: generateRequestHeaders({ authToken: authToken3 }) }
          )
          .then((result1) =>
            instance
              .post(
                apiUrl,
                generateGetSessionRequestPayload({
                  session_key:
                    result1.data.data.getInvitation.invitation.slot.key,
                }),
                { headers: generateRequestHeaders({ authToken: authToken3 }) }
              )
              .then((result2) => [result1, result2])
          ),
        instance
          .post(
            apiUrl,
            generateGetInvitationRequestPayload({
              email: inviteUser4.email,
              slot_id: inviteUser4.slot_id,
            }),
            { headers: generateRequestHeaders({ authToken: authToken4 }) }
          )
          .then((result1) =>
            instance
              .post(
                apiUrl,
                generateGetSessionRequestPayload({
                  session_key:
                    result1.data.data.getInvitation.invitation.slot.key,
                }),
                { headers: generateRequestHeaders({ authToken: authToken4 }) }
              )
              .then((result2) => [result1, result2])
          ),
        instance
          .post(
            apiUrl,
            generateGetInvitationRequestPayload({
              email: inviteUser5.email,
              slot_id: inviteUser5.slot_id,
            }),
            { headers: generateRequestHeaders({ authToken: authToken5 }) }
          )
          .then((result1) =>
            instance
              .post(
                apiUrl,
                generateGetSessionRequestPayload({
                  session_key:
                    result1.data.data.getInvitation.invitation.slot.key,
                }),
                { headers: generateRequestHeaders({ authToken: authToken5 }) }
              )
              .then((result2) => [result1, result2])
          ),
        instance
          .post(
            apiUrl,
            generateGetInvitationRequestPayload({
              email: inviteUser6.email,
              slot_id: inviteUser6.slot_id,
            }),
            { headers: generateRequestHeaders({ authToken: authToken6 }) }
          )
          .then((result1) =>
            instance
              .post(
                apiUrl,
                generateGetSessionRequestPayload({
                  session_key:
                    result1.data.data.getInvitation.invitation.slot.key,
                }),
                { headers: generateRequestHeaders({ authToken: authToken6 }) }
              )
              .then((result2) => [result1, result2])
          ),
      ]);

      const afterSessionRequestsTimestamp = getUnixTime(new Date());

      const getInvitation1ResponseData =
        getInvitationResponse1.data.data.getInvitation;

      const getInvitation2ResponseData =
        getInvitationResponse2.data.data.getInvitation;

      const getInvitation3ResponseData =
        getInvitationResponse3.data.data.getInvitation;

      const getInvitation4ResponseData =
        getInvitationResponse4.data.data.getInvitation;

      const getInvitation5ResponseData =
        getInvitationResponse5.data.data.getInvitation;

      const getInvitation6ResponseData =
        getInvitationResponse6.data.data.getInvitation;

      const getSession1ResponseData =
        getSessionResponse1.data.data.getSession.session;
      const getSession2ResponseData =
        getSessionResponse2.data.data.getSession.session;
      const getSession3ResponseData =
        getSessionResponse3.data.data.getSession.session;

      const getSession4ResponseData =
        getSessionResponse4.data.data.getSession.session;
      const getSession5ResponseData =
        getSessionResponse5.data.data.getSession.session;
      const getSession6ResponseData =
        getSessionResponse6.data.data.getSession.session;

      const sessionId = getSession1ResponseData.id;
      const [sessionProcess1, sessionProcess2] = await processOperations([
        {
          key: "findSessionProcess",
          data: { sessionId },
        },
      ]);

      // const user1SubscriptionCollection: any[] = [];
      // const user2SubscriptionCollection: any[] = [];
      // const user3SubscriptionCollection: any[] = [];

      // createSessionSubscription(
      //   { sessionId },
      //   authToken1,
      //   user1SubscriptionCollection
      // );
      // createSessionSubscription(
      //   { sessionId },
      //   authToken2,
      //   user2SubscriptionCollection
      // );
      // createSessionSubscription(
      //   { sessionId },
      //   authToken3,
      //   user3SubscriptionCollection
      // );

      // // PLAYER JOIN
      // const [
      //   [join1Response, player1ReadyResponse],
      //   [join2Response, player2ReadyResponse],
      //   [join3Response, player3ReadyResponse],
      // ] = await Promise.all([
      //   instance
      //     .post(
      //       apiUrl,
      //       generateJoinRequestPayload({
      //         sessionId,
      //       }),
      //       { headers: generateRequestHeaders({ authToken: authToken1 }) }
      //     )
      //     .then((result1) => {
      //       return instance
      //         .post(
      //           apiUrl,
      //           generateReadyToStartPayload({
      //             sessionId,
      //           }),
      //           { headers: generateRequestHeaders({ authToken: authToken1 }) }
      //         )
      //         .then((result2) => [result1, result2]);
      //     }),
      //   instance
      //     .post(
      //       apiUrl,
      //       generateJoinRequestPayload({
      //         sessionId,
      //       }),
      //       { headers: generateRequestHeaders({ authToken: authToken2 }) }
      //     )
      //     .then((result1) => {
      //       return instance
      //         .post(
      //           apiUrl,
      //           generateReadyToStartPayload({
      //             sessionId,
      //           }),
      //           { headers: generateRequestHeaders({ authToken: authToken2 }) }
      //         )
      //         .then((result2) => [result1, result2]);
      //     }),
      //   instance
      //     .post(
      //       apiUrl,
      //       generateJoinRequestPayload({
      //         sessionId,
      //       }),
      //       { headers: generateRequestHeaders({ authToken: authToken3 }) }
      //     )
      //     .then((result1) => {
      //       return instance
      //         .post(
      //           apiUrl,
      //           generateReadyToStartPayload({
      //             sessionId,
      //           }),
      //           { headers: generateRequestHeaders({ authToken: authToken3 }) }
      //         )
      //         .then((result2) => [result1, result2]);
      //     }),
      // ]);

      // // SET START EMOTIONS

      // const [
      //   [player1StartEmotionResponse, player1StartEmotionReadyResponse],
      //   [player2StartEmotionResponse, player3StartEmotionResponse],
      //   [player2StartEmotionReadyResponse, player3StartEmotionReadyResponse],
      // ] = await Promise.all([
      //   instance
      //     .post(
      //       apiUrl,
      //       generateSetActivityValuePayload({
      //         sessionId,
      //         activityId: "startEmotion",
      //         value: "5",
      //       }),
      //       { headers: generateRequestHeaders({ authToken: authToken1 }) }
      //     )
      //     .then((result1) =>
      //       instance
      //         .post(
      //           apiUrl,
      //           generateSetActivityReadyPayload({
      //             sessionId,
      //             activityId: "startEmotion",
      //           }),
      //           { headers: generateRequestHeaders({ authToken: authToken1 }) }
      //         )
      //         .then((result2) => [result1, result2])
      //     ),
      //   instance
      //     .post(
      //       apiUrl,
      //       generateSetActivityValuePayload({
      //         sessionId,
      //         activityId: "startEmotion",
      //         value: "3",
      //       }),
      //       { headers: generateRequestHeaders({ authToken: authToken2 }) }
      //     )
      //     .then((result1) =>
      //       instance
      //         .post(
      //           apiUrl,
      //           generateSetActivityReadyPayload({
      //             sessionId,
      //             activityId: "startEmotion",
      //           }),
      //           { headers: generateRequestHeaders({ authToken: authToken2 }) }
      //         )
      //         .then((result2) => [result1, result2])
      //     ),
      //   instance
      //     .post(
      //       apiUrl,
      //       generateSetActivityValuePayload({
      //         sessionId,
      //         activityId: "startEmotion",
      //         value: "6",
      //       }),
      //       { headers: generateRequestHeaders({ authToken: authToken3 }) }
      //     )
      //     .then((result1) =>
      //       instance
      //         .post(
      //           apiUrl,
      //           generateSetActivityReadyPayload({
      //             sessionId,
      //             activityId: "startEmotion",
      //           }),
      //           { headers: generateRequestHeaders({ authToken: authToken3 }) }
      //         )
      //         .then((result2) => [result1, result2])
      //     ),
      // ]);

      // // SET TEAM NAME
      // const [
      //   player1SetTeamNameResponse,
      //   player2SetTeamNameResponse,
      //   player3SetTeamNameResponse,
      // ] = await Promise.all([
      //   instance.post(
      //     apiUrl,
      //     generateSetActivityValuePayload({
      //       sessionId,
      //       activityId: "teamName",
      //       value: "The",
      //     }),
      //     { headers: generateRequestHeaders({ authToken: authToken1 }) }
      //   ),
      //   instance.post(
      //     apiUrl,
      //     generateSetActivityValuePayload({
      //       sessionId,
      //       activityId: "teamName",
      //       value: "Team",
      //     }),
      //     { headers: generateRequestHeaders({ authToken: authToken2 }) }
      //   ),
      //   instance.post(
      //     apiUrl,
      //     generateSetActivityValuePayload({
      //       sessionId,
      //       activityId: "teamName",
      //       value: "Is Cool",
      //     }),
      //     { headers: generateRequestHeaders({ authToken: authToken3 }) }
      //   ),
      // ]);

      // // SET SET TEAM NAME READY
      // const [
      //   player1TeamNameReadyResponse,
      //   player2TeamNameReadyResponse,
      //   player3TeamNameReadyResponse,
      // ] = await Promise.all([
      //   instance.post(
      //     apiUrl,
      //     generateSetActivityReadyPayload({
      //       sessionId,
      //       activityId: "teamName",
      //     }),
      //     { headers: generateRequestHeaders({ authToken: authToken1 }) }
      //   ),
      //   instance.post(
      //     apiUrl,
      //     generateSetActivityReadyPayload({
      //       sessionId,
      //       activityId: "teamName",
      //     }),
      //     { headers: generateRequestHeaders({ authToken: authToken2 }) }
      //   ),
      //   instance.post(
      //     apiUrl,
      //     generateSetActivityReadyPayload({
      //       sessionId,
      //       activityId: "teamName",
      //     }),
      //     { headers: generateRequestHeaders({ authToken: authToken3 }) }
      //   ),
      // ]);

      // let previousActivityId = null;
      // for (let i = 0; i < workshopActivities.length + 1; i++) {
      //   const lastSocketValues = [
      //     user1SubscriptionCollection[user1SubscriptionCollection.length - 1],
      //     user2SubscriptionCollection[user2SubscriptionCollection.length - 1],
      //     user3SubscriptionCollection[user3SubscriptionCollection.length - 1],
      //   ].sort(
      //     (a, b) =>
      //       a.data.sessionState.context.lastUpdatedTimestamp -
      //       b.data.sessionState.context.lastUpdatedTimestamp
      //   );
      //   const value = lastSocketValues[0].data.sessionState.value;

      //   if (value.includes(previousActivityId)) {
      //     --i;
      //   }
      //   if (value.includes("endEmotion")) {
      //     break;
      //   }
      //   const activity = workshopActivities[i];

      //   if (!value.includes("review")) {
      //     // SET ACTIVITY VALUE
      //     const [
      //       [player1SetActivityValueResponse, player1SetReadyResponse],
      //       [player2SetActivityValueResponse, player2SetReadyResponse],
      //       [player3SetActivityValueResponse, player3SetReadyResponse],
      //     ] = await Promise.all([
      //       instance
      //         .post(
      //           apiUrl,
      //           generateSetActivityValuePayload({
      //             sessionId,
      //             activityId: activity.id,
      //             value: "test value 1",
      //           }),
      //           { headers: generateRequestHeaders({ authToken: authToken1 }) }
      //         )
      //         .then((result1) =>
      //           instance
      //             .post(
      //               apiUrl,
      //               generateSetActivityReadyPayload({
      //                 sessionId,
      //                 activityId: activity.id,
      //               }),
      //               {
      //                 headers: generateRequestHeaders({
      //                   authToken: authToken1,
      //                 }),
      //               }
      //             )
      //             .then((result2) => [result1, result2])
      //         ),
      //       instance
      //         .post(
      //           apiUrl,
      //           generateSetActivityValuePayload({
      //             sessionId,
      //             activityId: activity.id,
      //             value: "test value 2",
      //           }),
      //           { headers: generateRequestHeaders({ authToken: authToken2 }) }
      //         )
      //         .then((result1) =>
      //           instance
      //             .post(
      //               apiUrl,
      //               generateSetActivityReadyPayload({
      //                 sessionId,
      //                 activityId: activity.id,
      //               }),
      //               {
      //                 headers: generateRequestHeaders({
      //                   authToken: authToken2,
      //                 }),
      //               }
      //             )
      //             .then((result2) => [result1, result2])
      //         ),
      //       instance
      //         .post(
      //           apiUrl,
      //           generateSetActivityValuePayload({
      //             sessionId,
      //             activityId: activity.id,
      //             value: "test value 3",
      //           }),
      //           { headers: generateRequestHeaders({ authToken: authToken3 }) }
      //         )
      //         .then((result1) =>
      //           instance
      //             .post(
      //               apiUrl,
      //               generateSetActivityReadyPayload({
      //                 sessionId,
      //                 activityId: activity.id,
      //               }),
      //               {
      //                 headers: generateRequestHeaders({
      //                   authToken: authToken3,
      //                 }),
      //               }
      //             )
      //             .then((result2) => [result1, result2])
      //         ),
      //     ]);
      //   } else {
      //     // SET ACTIVITY READY
      //     const [
      //       player1ActivityReady,
      //       player2ActivityReady,
      //       player3ActivityReady,
      //     ] = await Promise.all([
      //       instance.post(
      //         apiUrl,
      //         generateSetActivityReadyPayload({
      //           sessionId,
      //           activityId: activity.id,
      //         }),
      //         { headers: generateRequestHeaders({ authToken: authToken1 }) }
      //       ),
      //       instance.post(
      //         apiUrl,
      //         generateSetActivityReadyPayload({
      //           sessionId,
      //           activityId: activity.id,
      //         }),
      //         { headers: generateRequestHeaders({ authToken: authToken2 }) }
      //       ),
      //       instance.post(
      //         apiUrl,
      //         generateSetActivityReadyPayload({
      //           sessionId,
      //           activityId: activity.id,
      //         }),
      //         { headers: generateRequestHeaders({ authToken: authToken3 }) }
      //       ),
      //     ]);
      //   }

      //   previousActivityId = activity.id;
      // }

      // // SET END EMOTIONS
      // const [
      //   [player1EndEmotionResponse, player1EndEmotionReadyResponse],
      //   [player2EndEmotionResponse, player2EndEmotionReadyResponse],
      //   [player3EndEmotionResponse, player3EndEmotionReadyResponse],
      // ] = await Promise.all([
      //   instance
      //     .post(
      //       apiUrl,
      //       generateSetActivityValuePayload({
      //         sessionId,
      //         activityId: "endEmotion",
      //         value: "6",
      //       }),
      //       { headers: generateRequestHeaders({ authToken: authToken1 }) }
      //     )
      //     .then((result1) =>
      //       instance
      //         .post(
      //           apiUrl,
      //           generateSetActivityReadyPayload({
      //             sessionId,
      //             activityId: "endEmotion",
      //           }),
      //           { headers: generateRequestHeaders({ authToken: authToken1 }) }
      //         )
      //         .then((result2) => [result1, result2])
      //     ),
      //   instance
      //     .post(
      //       apiUrl,
      //       generateSetActivityValuePayload({
      //         sessionId,
      //         activityId: "endEmotion",
      //         value: "6",
      //       }),
      //       { headers: generateRequestHeaders({ authToken: authToken2 }) }
      //     )
      //     .then((result1) =>
      //       instance
      //         .post(
      //           apiUrl,
      //           generateSetActivityReadyPayload({
      //             sessionId,
      //             activityId: "endEmotion",
      //           }),
      //           { headers: generateRequestHeaders({ authToken: authToken2 }) }
      //         )
      //         .then((result2) => [result1, result2])
      //     ),
      //   instance
      //     .post(
      //       apiUrl,
      //       generateSetActivityValuePayload({
      //         sessionId,
      //         activityId: "endEmotion",
      //         value: "6",
      //       }),
      //       { headers: generateRequestHeaders({ authToken: authToken3 }) }
      //     )
      //     .then((result1) =>
      //       instance
      //         .post(
      //           apiUrl,
      //           generateSetActivityReadyPayload({
      //             sessionId,
      //             activityId: "endEmotion",
      //           }),
      //           { headers: generateRequestHeaders({ authToken: authToken3 }) }
      //         )
      //         .then((result2) => [result1, result2])
      //     ),
      // ]);

      // await cleanUp(sessionId);

      // const [sessionProcess2] = await processOperations([
      //   {
      //     key: "findSessionProcess",
      //     data: { sessionId },
      //   },
      // ]);

      // expect(typeof sessionProcess.id).to.be.equal("number");
      // expect(sessionProcess.id).to.be.greaterThan(0);
      // expect(sessionProcess2.id).to.be.equal(null);
      // expect(getSession1ResponseData.create_date).to.be.greaterThanOrEqual(
      //   beforeSessionRequestsTimestamp
      // );
      // expect(getSession1ResponseData.create_date).to.be.lessThanOrEqual(
      //   afterSessionRequestsTimestamp
      // );
      // expect(getSession1ResponseData.session_key).to.equal(
      //   getInvitation1ResponseData.invitation.slot.key
      // );
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
