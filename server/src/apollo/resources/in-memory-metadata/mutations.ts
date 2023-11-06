import { AuthenticatedAppContext } from "../../types";
import {
  publishInMemoryProfileMetadataState,
  publishInMemorySessionMetadataState,
} from "./helpers";
import { createInMemoryDispatcher } from "./+state";
import {
  addParticipant,
  endEmotionReady,
  groupActivityReady,
  profileActivityReady,
  readyToStart,
  removeParticipant,
  setEndEmotion,
  setGroupActivityValue,
  setProfileActivityValue,
  setStartEmotion,
  setTeamName,
  startEmotionReady,
  teamNameReady,
} from "./+state/actions";
import { InMemorySessionMetadataGraphQLState } from "../../types/in-memory-session-metadata-graphql-state";
import { InMemoryProfileMetadataGraphQLState } from "../../types/in-memory-profile-metadata-graphql-state";
import * as controller from "./controller";

export const mutationResolvers = {
  setProfileAsSessionParticipant(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    const action = addParticipant({
      ids: context.authenticatedProfile.profileId,
    });
    return controller
      .handleMutationAction(data.sessionId, action, context.pubSub)
      .then(
        ([[, inMemorySessionMetadataStateForGraphQL]]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  unsetProfileAsSessionParticipant(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    const action = removeParticipant({
      ids: context.authenticatedProfile.profileId,
    });
    return controller
      .handleMutationAction(data.sessionId, action, context.pubSub)
      .then(
        ([[, inMemorySessionMetadataStateForGraphQL]]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  readyToStart(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    const action = readyToStart({
      profileId: context.authenticatedProfile.profileId,
    });
    return controller
      .handleMutationAction(data.sessionId, action, context.pubSub)
      .then(
        ([[, inMemorySessionMetadataStateForGraphQL]]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  setTeamName(
    _: undefined,
    data: { sessionId: string; teamName: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    const action = setTeamName({ teamName: data.teamName });
    return controller
      .handleMutationAction(data.sessionId, action, context.pubSub)
      .then(
        ([[, inMemorySessionMetadataStateForGraphQL]]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  setTeamNameAsReady(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    const action = teamNameReady({
      profileId: context.authenticatedProfile.profileId,
    });
    return controller
      .handleMutationAction(data.sessionId, action, context.pubSub)
      .then(
        ([[, inMemorySessionMetadataStateForGraphQL]]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  setStartEmotion(
    _: undefined,
    data: { sessionId: string; emotion: number },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemoryProfileMetadataGraphQLState> {
    const action = setStartEmotion({
      emotion: data.emotion,
      profileId: context.authenticatedProfile.profileId,
    });
    return controller
      .handleMutationAction(data.sessionId, action, context.pubSub)
      .then(
        ([, [, inMemorySessionMetadataStateForGraphQL]]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  setStartEmotionAsReady(
    _: undefined,
    data: { sessionId: string; emotion: number },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemoryProfileMetadataGraphQLState> {
    const action = startEmotionReady({
      profileId: context.authenticatedProfile.profileId,
    });
    return controller
      .handleMutationAction(data.sessionId, action, context.pubSub)
      .then(
        ([, [, inMemorySessionMetadataStateForGraphQL]]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  setEndEmotionAsReady(
    _: undefined,
    data: { sessionId: string; emotion: number },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemoryProfileMetadataGraphQLState> {
    const action = endEmotionReady({
      profileId: context.authenticatedProfile.profileId,
    });
    return controller
      .handleMutationAction(data.sessionId, action, context.pubSub)
      .then(
        ([, [, inMemorySessionMetadataStateForGraphQL]]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  setEndEmotion(
    _: undefined,
    data: { sessionId: string; emotion: number },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemoryProfileMetadataGraphQLState> {
    const action = setEndEmotion({
      emotion: data.emotion,
      profileId: context.authenticatedProfile.profileId,
    });
    return controller
      .handleMutationAction(data.sessionId, action, context.pubSub)
      .then(
        ([, [, inMemorySessionMetadataStateForGraphQL]]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  setProfileActivityValue(
    _: undefined,
    data: {
      sessionId: string;
      questionId: string;
    },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemoryProfileMetadataGraphQLState> {
    const action = setProfileActivityValue({
      profileId: context.authenticatedProfile.profileId,
      questionId: data.questionId,
    });
    return controller
      .handleMutationAction(data.sessionId, action, context.pubSub)
      .then(
        ([, [, inMemorySessionMetadataStateForGraphQL]]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  setProfileActivityAsReady(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemoryProfileMetadataGraphQLState> {
    const action = profileActivityReady({
      profileId: context.authenticatedProfile.profileId,
    });
    return controller
      .handleMutationAction(data.sessionId, action, context.pubSub)
      .then(
        ([, [, inMemorySessionMetadataStateForGraphQL]]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  setGroupActivityValue(
    _: undefined,
    data: {
      sessionId: string;
      questionId: string;
    },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    const action = setGroupActivityValue({
      profileId: context.authenticatedProfile.profileId,
      questionId: data.questionId,
    });
    return controller
      .handleMutationAction(data.sessionId, action, context.pubSub)
      .then(
        ([[, inMemorySessionMetadataStateForGraphQL]]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  setGroupActivityAsReady(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    const action = groupActivityReady({
      profileId: context.authenticatedProfile.profileId,
    });
    return controller
      .handleMutationAction(data.sessionId, action, context.pubSub)
      .then(
        ([[, inMemorySessionMetadataStateForGraphQL]]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
};
