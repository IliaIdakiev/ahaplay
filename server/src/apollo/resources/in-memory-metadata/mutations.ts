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

export const mutationResolvers = {
  setProfileAsSessionParticipant(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          addParticipant({ ids: context.authenticatedProfile.profileId })
        )
      )
      .then(([{ state: inMemorySessionMetadataState }]) =>
        publishInMemorySessionMetadataState(
          context.pubSub,
          inMemorySessionMetadataState
        )
      )
      .then(
        ([, inMemorySessionMetadataStateForGraphQL]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  unsetProfileAsSessionParticipant(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          removeParticipant({ ids: context.authenticatedProfile.profileId })
        )
      )
      .then(([{ state: inMemorySessionMetadataState }]) =>
        publishInMemorySessionMetadataState(
          context.pubSub,
          inMemorySessionMetadataState
        )
      )
      .then(
        ([, inMemorySessionMetadataStateForGraphQL]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  readyToStart(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          readyToStart({ profileId: context.authenticatedProfile.profileId })
        )
      )
      .then(([{ state: inMemorySessionMetadataState }]) =>
        publishInMemorySessionMetadataState(
          context.pubSub,
          inMemorySessionMetadataState
        )
      )
      .then(
        ([, inMemorySessionMetadataStateForGraphQL]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  setTeamName(
    _: undefined,
    data: { sessionId: string; teamName: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(setTeamName({ teamName: data.teamName }))
      )
      .then(([{ state: inMemorySessionMetadataState }]) =>
        publishInMemorySessionMetadataState(
          context.pubSub,
          inMemorySessionMetadataState
        )
      )
      .then(
        ([, inMemorySessionMetadataStateForGraphQL]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  setTeamNameAsReady(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          teamNameReady({ profileId: context.authenticatedProfile.profileId })
        )
      )
      .then(([{ state: inMemorySessionMetadataState }]) =>
        publishInMemorySessionMetadataState(
          context.pubSub,
          inMemorySessionMetadataState
        )
      )
      .then(
        ([, inMemorySessionMetadataStateForGraphQL]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  setStartEmotion(
    _: undefined,
    data: { sessionId: string; emotion: number },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemoryProfileMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          setStartEmotion({
            emotion: data.emotion,
            profileId: context.authenticatedProfile.profileId,
          })
        )
      )
      .then(([, { state: inMemoryProfileMetadataState }]) =>
        publishInMemoryProfileMetadataState(
          context.pubSub,
          inMemoryProfileMetadataState
        )
      )
      .then(
        ([, inMemoryProfileMetadataStateForGraphQL]) =>
          inMemoryProfileMetadataStateForGraphQL
      );
  },
  setStartEmotionAsReady(
    _: undefined,
    data: { sessionId: string; emotion: number },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemoryProfileMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          startEmotionReady({
            profileId: context.authenticatedProfile.profileId,
          })
        )
      )
      .then(([, { state: inMemoryProfileMetadataState }]) =>
        publishInMemoryProfileMetadataState(
          context.pubSub,
          inMemoryProfileMetadataState
        )
      )
      .then(
        ([, inMemoryProfileMetadataStateForGraphQL]) =>
          inMemoryProfileMetadataStateForGraphQL
      );
  },
  setEndEmotionAsReady(
    _: undefined,
    data: { sessionId: string; emotion: number },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemoryProfileMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          endEmotionReady({
            profileId: context.authenticatedProfile.profileId,
          })
        )
      )
      .then(([, { state: inMemoryProfileMetadataState }]) =>
        publishInMemoryProfileMetadataState(
          context.pubSub,
          inMemoryProfileMetadataState
        )
      )
      .then(
        ([, inMemoryProfileMetadataStateForGraphQL]) =>
          inMemoryProfileMetadataStateForGraphQL
      );
  },
  setEndEmotion(
    _: undefined,
    data: { sessionId: string; emotion: number },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemoryProfileMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          setEndEmotion({
            emotion: data.emotion,
            profileId: context.authenticatedProfile.profileId,
          })
        )
      )
      .then(([, { state: inMemoryProfileMetadataState }]) =>
        publishInMemoryProfileMetadataState(
          context.pubSub,
          inMemoryProfileMetadataState
        )
      )
      .then(
        ([, inMemoryProfileMetadataStateForGraphQL]) =>
          inMemoryProfileMetadataStateForGraphQL
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
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          setProfileActivityValue({
            profileId: context.authenticatedProfile.profileId,
            questionId: data.questionId,
          })
        )
      )
      .then(([, { state: inMemoryProfileMetadataState }]) =>
        publishInMemoryProfileMetadataState(
          context.pubSub,
          inMemoryProfileMetadataState
        )
      )
      .then(
        ([, inMemoryProfileMetadataStateForGraphQL]) =>
          inMemoryProfileMetadataStateForGraphQL
      );
  },
  setProfileActivityAsReady(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemoryProfileMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          profileActivityReady({
            profileId: context.authenticatedProfile.profileId,
          })
        )
      )
      .then(([, { state: inMemoryProfileMetadataState }]) =>
        publishInMemoryProfileMetadataState(
          context.pubSub,
          inMemoryProfileMetadataState
        )
      )
      .then(
        ([, inMemoryProfileMetadataStateForGraphQL]) =>
          inMemoryProfileMetadataStateForGraphQL
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
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          setGroupActivityValue({
            profileId: context.authenticatedProfile.profileId,
            questionId: data.questionId,
          })
        )
      )
      .then(([{ state: inMemorySessionMetadataState }]) =>
        publishInMemorySessionMetadataState(
          context.pubSub,
          inMemorySessionMetadataState
        )
      )
      .then(
        ([, inMemorySessionMetadataStateForGraphQL]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
  setGroupActivityAsReady(
    _: undefined,
    data: { sessionId: string },
    context: AuthenticatedAppContext,
    info: any
  ): Promise<InMemorySessionMetadataGraphQLState> {
    return createInMemoryDispatcher(data.sessionId)
      .then((dispatcher) =>
        dispatcher(
          groupActivityReady({
            profileId: context.authenticatedProfile.profileId,
          })
        )
      )
      .then(([{ state: inMemorySessionMetadataState }]) =>
        publishInMemorySessionMetadataState(
          context.pubSub,
          inMemorySessionMetadataState
        )
      )
      .then(
        ([, inMemorySessionMetadataStateForGraphQL]) =>
          inMemorySessionMetadataStateForGraphQL
      );
  },
};
