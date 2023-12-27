import {
  workshopDistributorResponseChannel,
  workshopDistributorRequestChannel,
} from "./constants";
import config from "./config";
import { connectRedis, redisClient, pubSub } from "./redis";
import {
  WorkshopDistributionResult,
  WorkshopDistributorRequestAddMessage,
  WorkshopDistributorRequestGetMessage,
  WorkshopDistributorRequestType,
} from "./types/distribution-message";

const workshopCollectionRedisKey = "workshop-distributor-workshop-collection";
type WorkshopDistributorItem = {
  profileId: string;
  splitSessionKey: string;
  sessionKey: string;
  group: number;
  slotId: string;
  invitationId: string;
}[];
type WorkshopDistributorData = Record<string, WorkshopDistributorItem>;
let workshopCollection: WorkshopDistributorData = {};

function generateSplitSessionKey(sessionKey: string, group: number) {
  return `${group}:${sessionKey}`;
}

function distributionInGroupGroup(
  currentWorkshopData: WorkshopDistributorItem,
  profileId: string,
  sessionKey: string,
  slotId: string,
  invitationId: string
) {
  let groupNumber =
    currentWorkshopData[currentWorkshopData.length - 1]?.group || 1;
  const lastGroupParticipants = currentWorkshopData.filter(
    (v) => v.group === groupNumber
  );
  if (
    lastGroupParticipants.length > config.workshop.maximumWorkshopParticipants
  )
    groupNumber++;

  const result = {
    profileId,
    splitSessionKey: generateSplitSessionKey(sessionKey, groupNumber),
    group: groupNumber,
    sessionKey,
    slotId,
    invitationId,
  };
  currentWorkshopData.push(result);
  return result;
}

function workshopDistributorProcessHandler(
  message:
    | WorkshopDistributorRequestAddMessage
    | WorkshopDistributorRequestGetMessage
) {
  try {
    if (!workshopCollection[message.data.sessionKey])
      workshopCollection[message.data.sessionKey] = [];
    const currentWorkshopData: WorkshopDistributorItem =
      workshopCollection[message.data.sessionKey];
    if (message.type === WorkshopDistributorRequestType.ADD) {
      const addMessage = message as WorkshopDistributorRequestAddMessage;
      const existingProfile = currentWorkshopData.find(
        (a) =>
          a.profileId === addMessage.data.profileId &&
          a.sessionKey === addMessage.data.sessionKey
      );
      if (existingProfile)
        return void pubSub.publish(
          workshopDistributorResponseChannel,
          existingProfile
        );
      const distributionProfile = distributionInGroupGroup(
        currentWorkshopData,
        addMessage.data.profileId,
        addMessage.data.sessionKey,
        addMessage.data.slotId,
        addMessage.data.invitationId
      );
      redisClient.set(
        workshopCollectionRedisKey,
        JSON.stringify(workshopCollection)
      );
      return void pubSub.publish<WorkshopDistributionResult>(
        workshopDistributorResponseChannel,
        {
          data: {
            splitSessionKey: distributionProfile.splitSessionKey,
            group: distributionProfile.group,
            invitationId: distributionProfile.invitationId,
            sessionKey: distributionProfile.sessionKey,
            profileId: distributionProfile.profileId,
            slotId: distributionProfile.slotId,
          },
          uuid: message.uuid,
          error: null,
        }
      );
    }
    const getMessage = message as WorkshopDistributorRequestGetMessage;
    const existingProfile = currentWorkshopData.find((a) => {
      const searchValues = Object.entries(getMessage.data);
      let match = true;
      for (const [key, value] of searchValues) {
        match = (a as any)[key] === value && match;
        if (!match) break;
      }
      return match;
    });

    pubSub.publish<WorkshopDistributionResult>(
      workshopDistributorResponseChannel,
      {
        data: existingProfile
          ? {
              splitSessionKey: existingProfile.splitSessionKey,
              group: existingProfile.group,
              invitationId: existingProfile.invitationId,
              sessionKey: existingProfile.sessionKey,
              profileId: existingProfile.profileId,
              slotId: existingProfile.slotId,
            }
          : null,
        uuid: message.uuid,
        error: null,
      }
    );
  } catch (error: any) {
    pubSub.publish<WorkshopDistributionResult>(
      workshopDistributorResponseChannel,
      {
        data: {
          slotId: "<WILL_BE_OVERWRITTEN_BY_SPREAD>",
          invitationId: "<WILL_BE_OVERWRITTEN_BY_SPREAD>",
          splitSessionKey: null,
          group: null,
          ...message.data,
        },
        uuid: message.uuid,
        error,
      }
    );
  }
}

connectRedis()
  .then(() => redisClient.get(workshopCollectionRedisKey))
  .then((workshopsString) => {
    try {
      if (typeof workshopsString === "string")
        return JSON.parse(workshopsString);
      return {};
    } catch (e) {}
    return {};
  })
  .then((redisWorkshopCollection) => {
    workshopCollection = redisWorkshopCollection;
    console.log("Workshop distro ready to distribute 🚀");
    return pubSub.subscribe(
      workshopDistributorRequestChannel,
      workshopDistributorProcessHandler
    );
  });
