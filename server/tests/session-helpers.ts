import { response } from "express";
import {
  apiUrl,
  createSessionSubscription,
  delay,
  generateGetInvitationRequestPayload,
  generateGetSessionRequestPayload,
  generateJoinRequestPayload,
  generateReadyToStartPayload,
  generateRequestHeaders,
  generateSetActivityReadyPayload,
  generateSetActivityValuePayload,
  instance,
} from "./helpers";

export function generateSetupCommands({
  numberOfProfiles,
  scheduleDate,
  workshopIndex,
  slotType,
}: {
  numberOfProfiles: number;
  workshopIndex: number;
  scheduleDate?: Date;
  slotType?: "ALL" | "SPLIT";
}) {
  const schedule_date = scheduleDate || new Date();
  const profileCreation = new Array(numberOfProfiles)
    .fill(null)
    .map((_, i) => ({
      key: "createProfile",
      data: {
        name: `Test profile ${i}`,
        email: `test-${i}@ahaplay.com`,
        workspace_id: [workshopIndex, "id"],
        access: i === 0 ? "OWNER" : "TEAM_MEMBER",
        status: "ACTIVE",
        is_completed: true,
      },
    }));

  const authTokens = profileCreation.map((_, i) => ({
    key: "getAuthToken",
    data: {
      email: [i + 2, "email"],
    },
  }));

  const invites = profileCreation.map((_, i) => ({
    key: "createInvite",
    data: {
      email: [i + 2, "email"],
      status: "ACCEPTED",
      profile_id: [i + 2, "id"],
      slot_id: [2 + 2 * numberOfProfiles, "id"],
    },
  }));

  return [
    {
      key: "createWorkspace",
      data: { name: "My test workspace", domains: ["ahaplay.com"] },
    },
    {
      key: "getWorkshops",
      data: {},
    },
    ...profileCreation,
    ...authTokens,
    {
      key: "createSlot",
      data: {
        type: slotType || "ALL",
        schedule_date,
        creator_id: ["2", "id"],
        workshop_id: ["1", "0", "id"],
        workspace_id: ["0", "id"],
        ics: "",
        ics_uid: "",
        status: "SCHEDULED",
        reminder_status: "NONE",
      },
    },
    ...invites,
  ];
}

export function getWorkshopResponse(responses: any[]) {
  return responses[1];
}

export function getSlotResponse(responses: any[]) {
  const numberOfProfiles = (responses.length - 3) / 3;
  return responses[2 + numberOfProfiles * 2];
}

export function getUserSetupResponses(responses: any[]) {
  const numberOfProfiles = (responses.length - 3) / 3;
  return responses.slice(2, numberOfProfiles + 2);
}

export function getAuthTokenSetupResponses(responses: any[]) {
  const numberOfProfiles = (responses.length - 3) / 3;
  return responses.slice(
    2 + numberOfProfiles,
    2 + numberOfProfiles + numberOfProfiles
  );
}

export function iterateAndApplyOverProfiles({
  invitationAndSessionResponses,
  setupResponses,
  fn,
  values,
}: {
  invitationAndSessionResponses: any[];
  setupResponses: any[];
  fn:
    | ((data: { sessionId: string; authToken: string }) => any)
    | ((data: { sessionId: string; authToken: string; value: any }) => any);
  values?: any[];
}) {
  const profiles = getUserSetupResponses(setupResponses);
  const tokens = getAuthTokenSetupResponses(setupResponses);

  return invitationAndSessionResponses.map(
    ([invitationResponse, sessionResponse], index) => {
      const invitationResponseData =
        invitationResponse.data.data.getInvitation.invitation;
      const invitationProfileId = invitationResponseData.profile_id;
      const sessionResponseData = sessionResponse.data.data.getSession.session;
      const sessionId = sessionResponseData.id;

      const profileIndex = profiles.findIndex(
        (p) => p.id === invitationProfileId
      );
      const authToken = tokens[profileIndex];
      const value = values?.[index];
      return fn({ sessionId, authToken, value });
    }
  );
}

export function activitySetValueForProfileFactory(activityId: string) {
  return function setActivityValueForProfile({
    sessionId,
    authToken,
    value,
  }: {
    sessionId: string;
    authToken: string;
    value: any;
  }) {
    return instance.post(
      apiUrl,
      generateSetActivityValuePayload({
        sessionId,
        activityId,
        value,
      }),
      {
        headers: generateRequestHeaders({
          authToken,
        }),
      }
    );
  };
}

export function activityReadyForProfileFactory(activityId: string) {
  return function setActivityReadyForProfile({
    sessionId,
    authToken,
  }: {
    sessionId: string;
    authToken: string;
  }) {
    return instance.post(
      apiUrl,
      generateSetActivityReadyPayload({
        sessionId,
        activityId,
      }),
      {
        headers: generateRequestHeaders({
          authToken,
        }),
      }
    );
  };
}

export function activityReadyForAllProfileFactory(activityId: string) {
  return function setActivityReadyForAllProfile(data: {
    invitationAndSessionResponses: any[];
    setupResponses: any[];
  }) {
    return Promise.all(
      iterateAndApplyOverProfiles({
        ...data,
        fn: activityReadyForProfileFactory(activityId),
      })
    );
  };
}

export function activityValueAndReadyForProfileFactory(activityId: string) {
  return function setActivityValueAndReadyForProfile({
    sessionId,
    authToken,
    value,
  }: {
    sessionId: string;
    authToken: string;
    value: string;
  }) {
    return instance
      .post(
        apiUrl,
        generateSetActivityValuePayload({
          sessionId,
          activityId,
          value,
        }),
        { headers: generateRequestHeaders({ authToken }) }
      )
      .then((result1) =>
        activityReadyForProfileFactory(activityId)({
          sessionId,
          authToken,
        }).then((result2) => [result1, result2])
      );
  };
}

export function activityValueAndReadyForAllProfileFactory(activityId: string) {
  return function setActivityValueAndReadyForAllProfile(data: {
    invitationAndSessionResponses: any[];
    setupResponses: any[];
    values: any[];
  }) {
    return Promise.all(
      iterateAndApplyOverProfiles({
        ...data,
        fn: activityValueAndReadyForProfileFactory(activityId),
      })
    );
  };
}

export function getInvitationAndSessionForInvitedUser(
  email: string,
  authToken: string,
  slotId: string
) {
  return instance
    .post(
      apiUrl,
      generateGetInvitationRequestPayload({
        email,
        slot_id: slotId,
      }),
      { headers: generateRequestHeaders({ authToken }) }
    )
    .then((result1) =>
      instance
        .post(
          apiUrl,
          generateGetSessionRequestPayload({
            session_key: result1.data.data.getInvitation.invitation.slot.key,
          }),
          { headers: generateRequestHeaders({ authToken }) }
        )
        .then((result2) => [result1, result2])
    );
}

export function getInvitationAndSessionForAllInvitedUser(responses: any[]) {
  const profiles = getUserSetupResponses(responses);
  const tokens = getAuthTokenSetupResponses(responses);
  const slot = getSlotResponse(responses);

  return Promise.all(
    profiles.map((profile, index) =>
      getInvitationAndSessionForInvitedUser(
        profile.email,
        tokens[index],
        slot.id
      )
    )
  );
}

export function createSubscriptionForProfile({
  sessionId,
  authToken,
}: {
  sessionId: string;
  authToken: string;
}) {
  const userSubscriptionCollection: any[] = [];

  createSessionSubscription(
    { sessionId },
    authToken,
    userSubscriptionCollection
  );
  return { [sessionId]: userSubscriptionCollection };
}

export function createSubscriptionForAllProfiles(data: {
  invitationAndSessionResponses: any[];
  setupResponses: any[];
}) {
  return iterateAndApplyOverProfiles({
    ...data,
    fn: createSubscriptionForProfile,
  });
}

export function joinAndSetReadyToStartForProfile({
  sessionId,
  authToken,
}: {
  sessionId: string;
  authToken: string;
}) {
  return instance
    .post(
      apiUrl,
      generateJoinRequestPayload({
        sessionId,
      }),
      { headers: generateRequestHeaders({ authToken }) }
    )
    .then((result1) => {
      return instance
        .post(
          apiUrl,
          generateReadyToStartPayload({
            sessionId,
          }),
          { headers: generateRequestHeaders({ authToken }) }
        )
        .then((result2) => [result1, result2]);
    });
}

export function joinAndSetReadyToStartForAllProfiles(data: {
  invitationAndSessionResponses: any[];
  setupResponses: any[];
}) {
  return Promise.all(
    iterateAndApplyOverProfiles({
      ...data,
      fn: joinAndSetReadyToStartForProfile,
    })
  );
}

export function setStartEmotionAndReadyForAllProfile(data: {
  invitationAndSessionResponses: any[];
  setupResponses: any[];
  values: any[];
}) {
  return activityValueAndReadyForAllProfileFactory("startEmotion")(data);
}

export function setEndEmotionAndReadyForAllProfile(data: {
  invitationAndSessionResponses: any[];
  setupResponses: any[];
  values: any[];
}) {
  return activityValueAndReadyForAllProfileFactory("endEmotion")(data);
}

export function setTeamNameForProfile(data: {
  sessionId: string;
  authToken: string;
  value: string;
}) {
  return activitySetValueForProfileFactory("teamName")(data);
}

export function setTeamNameForAllProfile(data: {
  invitationAndSessionResponses: any[];
  setupResponses: any[];
  values: any[];
}) {
  return Promise.all(
    iterateAndApplyOverProfiles({
      ...data,
      fn: setTeamNameForProfile,
    })
  );
}

export function setTeamNameReadyForProfile(data: {
  sessionId: string;
  authToken: string;
}) {
  return activityReadyForProfileFactory("teamName")(data);
}

export function setTeamNameReadyForAllProfile(data: {
  invitationAndSessionResponses: any[];
  setupResponses: any[];
}) {
  return Promise.all(
    iterateAndApplyOverProfiles({
      ...data,
      fn: setTeamNameReadyForProfile,
    })
  );
}

export async function workshopGamePlay({
  sessionIds,
  setupResponses,
  subscriptionResults,
  invitationAndSessionResponses,
  workshopIndex,
  valuesPerActivityId,
}: {
  sessionIds: string[];
  invitationAndSessionResponses: any[];
  setupResponses: any[];
  subscriptionResults: any[];
  workshopIndex: number;
  valuesPerActivityId: Record<string, string[]>;
}) {
  const workshop = getWorkshopResponse(setupResponses)[workshopIndex];
  const workshopActivities = workshop.activities.sort(
    (a: any, b: any) => a.sequence_number - b.sequence_number
  );

  let previousActivityId = null;
  const allResults: Record<string, any[]> = sessionIds.reduce(
    (acc: any, curr: any) => {
      acc[curr] = [];
      return acc;
    },
    {}
  );

  for (let i = 0; i < workshopActivities.length + 1; i++) {
    for (const sessionId of sessionIds) {
      const subscriptionResultsForSession = subscriptionResults.filter(
        (v) => !!v[sessionId]
      );

      const lastSocketValues = subscriptionResultsForSession
        .map(
          (singleSubscriptionResults) =>
            singleSubscriptionResults[sessionId][
              singleSubscriptionResults[sessionId].length - 1
            ]
        )
        .sort(
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
        const values = valuesPerActivityId[activity.id];
        const results = await activityValueAndReadyForAllProfileFactory(
          activity.id
        )({ invitationAndSessionResponses, setupResponses, values });
        allResults[sessionId].push(results);
      } else {
        const results = await activityReadyForAllProfileFactory(activity.id)({
          invitationAndSessionResponses,
          setupResponses,
        });
        allResults[sessionId].push(results);
      }

      previousActivityId = activity.id;
    }
    await delay(0);
  }
  return allResults;
}
