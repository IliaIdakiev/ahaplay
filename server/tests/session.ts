import { getUnixTime } from "date-fns";
import {
  apiUrl,
  generateGetInvitationRequestPayload,
  generateGetSessionRequestPayload,
  generateRequestHeaders,
  instance,
  processOperations,
  setupDatabase,
  getRandomNumber,
} from "./helpers";
import { expect } from "chai";
import WebSocket from "ws";
import {
  createSubscriptionForAllProfiles,
  generateSetupCommands,
  getInvitationAndSessionForAllInvitedUser,
  getWorkshopResponse,
  joinAndSetReadyToStartForAllProfiles,
  setEndEmotionAndReadyForAllProfile,
  setStartEmotionAndReadyForAllProfile,
  setTeamNameForAllProfile,
  setTeamNameReadyForAllProfile,
  workshopGamePlay,
} from "./session-helpers";

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
      const workshopIndex = 0;
      const setupCommands = generateSetupCommands({
        numberOfProfiles: 3,
        workshopIndex,
      });
      const setupResponses = await setupDatabase(setupCommands);

      const beforeSessionRequestsTimestamp = getUnixTime(new Date());

      const invitationAndSessionResponses =
        await getInvitationAndSessionForAllInvitedUser(setupResponses);

      const getInvitationResponses = invitationAndSessionResponses.map(
        ([invitationResponse]) => invitationResponse.data.data.getInvitation
      );
      const getSessionResponses = invitationAndSessionResponses.map(
        ([, sessionResponse]) => sessionResponse.data.data.getSession
      );

      const sessionIds = Array.from(
        new Set(
          invitationAndSessionResponses.map(
            ([, sessionResponse]) =>
              sessionResponse.data.data.getSession.session.id
          )
        )
      );

      const afterSessionRequestsTimestamp = getUnixTime(new Date());

      const [sessionProcess] = await processOperations([
        {
          key: "findSessionProcess",
          data: { sessionId: sessionIds[0] },
        },
      ]);

      const subscriptionResults = createSubscriptionForAllProfiles({
        invitationAndSessionResponses,
        setupResponses,
      });
      const joinResults = await joinAndSetReadyToStartForAllProfiles({
        invitationAndSessionResponses,
        setupResponses,
      });

      const startEmotionAndReadyResponses =
        await setStartEmotionAndReadyForAllProfile({
          invitationAndSessionResponses,
          setupResponses,
          values: new Array(3)
            .fill(null)
            .map(() => getRandomNumber(0, 6).toString()),
        });

      const setTeamNameResponses = await setTeamNameForAllProfile({
        invitationAndSessionResponses,
        setupResponses,
        values: [
          "Just some random strings",
          "without knowing which one",
          "will be the winning one",
        ],
      });

      const setTeamNameReadyResponses = await setTeamNameReadyForAllProfile({
        invitationAndSessionResponses,
        setupResponses,
      });

      const workshop = getWorkshopResponse(setupResponses)[workshopIndex];

      const valuesPerActivityId = workshop.activities.reduce(
        (acc: any, activity: any) => {
          acc[activity.id] = new Array(3)
            .fill(null)
            .map(() => `random-value-${getRandomNumber(0, 100)}`);
          return acc;
        },
        {}
      );

      const workshopResults = await workshopGamePlay({
        sessionIds,
        setupResponses,
        invitationAndSessionResponses,
        subscriptionResults,
        workshopIndex,
        valuesPerActivityId,
      });

      const endEmotionAndReadyResponses =
        await setEndEmotionAndReadyForAllProfile({
          invitationAndSessionResponses,
          setupResponses,
          values: new Array(3).fill(null).map(() => "6"),
        });

      await cleanUp(sessionIds[0]);

      const [sessionProcessAfter] = await processOperations([
        {
          key: "findSessionProcess",
          data: { sessionId: sessionIds[0] },
        },
      ]);

      expect(typeof sessionProcess.id).to.be.equal("number");
      expect(sessionProcess.id).to.be.greaterThan(0);
      expect(sessionProcessAfter.id).to.be.equal(null);
      expect(
        getSessionResponses[0].session.create_date
      ).to.be.greaterThanOrEqual(beforeSessionRequestsTimestamp);
      expect(getSessionResponses[0].session.create_date).to.be.lessThanOrEqual(
        afterSessionRequestsTimestamp
      );
      expect(getSessionResponses[0].session.session_key).to.equal(
        getInvitationResponses[0].invitation.slot.key
      );
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it.only("should start session for SPLIT slot", async () => {
    try {
      const workshopIndex = 0;
      const numberOfProfiles = 21;

      const setupCommands = generateSetupCommands({
        numberOfProfiles,
        workshopIndex,
        slotType: "SPLIT",
      });
      const setupResponses = await setupDatabase(setupCommands);

      const beforeSessionRequestsTimestamp = getUnixTime(new Date());

      const invitationAndSessionResponses =
        await getInvitationAndSessionForAllInvitedUser(setupResponses);

      const getInvitationResponses = invitationAndSessionResponses.map(
        ([invitationResponse]) => invitationResponse.data.data.getInvitation
      );
      const getSessionResponses = invitationAndSessionResponses.map(
        ([, sessionResponse]) => sessionResponse.data.data.getSession
      );

      const sessionIds = Array.from(
        new Set(
          invitationAndSessionResponses.map(
            ([, sessionResponse]) =>
              sessionResponse.data.data.getSession.session.id
          )
        )
      );

      const afterSessionRequestsTimestamp = getUnixTime(new Date());

      const sessionProcesses = await Promise.all(
        sessionIds.map((sessionId) =>
          processOperations([
            {
              key: "findSessionProcess",
              data: { sessionId: sessionId },
            },
          ])
        )
      );

      const subscriptionResults = createSubscriptionForAllProfiles({
        invitationAndSessionResponses,
        setupResponses,
      });

      const joinResults = await joinAndSetReadyToStartForAllProfiles({
        invitationAndSessionResponses,
        setupResponses,
      });

      const startEmotionAndReadyResponses =
        await setStartEmotionAndReadyForAllProfile({
          invitationAndSessionResponses,
          setupResponses,
          values: new Array(numberOfProfiles)
            .fill(null)
            .map(() => getRandomNumber(0, 6).toString()),
        });

      const setTeamNameResponses = await setTeamNameForAllProfile({
        invitationAndSessionResponses,
        setupResponses,
        values: new Array(numberOfProfiles)
          .fill(null)
          .map((_, i) => `the-team-${i}`),
      });

      const setTeamNameReadyResponses = await setTeamNameReadyForAllProfile({
        invitationAndSessionResponses,
        setupResponses,
      });

      const workshop = getWorkshopResponse(setupResponses)[workshopIndex];

      const valuesPerActivityId = workshop.activities.reduce(
        (acc: any, activity: any) => {
          acc[activity.id] = new Array(numberOfProfiles)
            .fill(null)
            .map(() => `random-value-${getRandomNumber(0, 100)}`);
          return acc;
        },
        {}
      );

      const allResults = await workshopGamePlay({
        sessionIds,
        setupResponses,
        invitationAndSessionResponses,
        subscriptionResults,
        workshopIndex,
        valuesPerActivityId,
      });

      const endEmotionAndReadyResponses =
        await setEndEmotionAndReadyForAllProfile({
          invitationAndSessionResponses,
          setupResponses,
          values: new Array(numberOfProfiles).fill(null).map(() => "6"),
        });

      await Promise.all(sessionIds.map((sessionId) => cleanUp(sessionId)));
      debugger;

      // const [session1ProcessAfter] = await processOperations([
      //   {
      //     key: "findSessionProcess",
      //     data: { sessionId: sessionIds[0] },
      //   },
      // ]);

      // const [session2ProcessAfter] = await processOperations([
      //   {
      //     key: "findSessionProcess",
      //     data: { sessionId: sessionIds[1] },
      //   },
      // ]);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
});
