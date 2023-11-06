import { UniqueConstraintError } from "sequelize";
import { InMemorySessionMetadataStateError } from "../../types";
import { models, SessionModelInstance, SessionStatus } from "../../../database";
import {
  readSlotWithWorkshopActivitiesAndRelatedQuestions,
  generateSessionKey,
  saveInMemoryProfileMetadataState,
  saveInMemorySessionMetadataState,
  readInMemorySessionMetadataState,
  publishInMemorySessionMetadataState,
  readInMemoryProfileMetadataState,
  publishInMemoryProfileMetadataState,
  graphqlInMemorySessionStateSerializer,
  graphqlInMemoryProfileStateSerializer,
} from "./helpers";
import { RedisPubSub } from "graphql-redis-subscriptions";
import {
  InMemorySessionMetadataState,
  createSessionReducerInitialState,
} from "./+state/reducers/session";
import { createInMemoryDispatcher, InMemoryMetadataActions } from "./+state";
import { addConnectedProfile, removeConnectedProfile } from "./+state/actions";
import { Unpack } from "../../../types";
import { InMemorySessionMetadataGraphQLState } from "../../types/in-memory-session-metadata-graphql-state";
import { InMemoryProfileMetadataGraphQLState } from "../../types/in-memory-profile-metadata-graphql-state";
import { InMemoryProfileMetadataState } from "./+state/reducers";
import { SlotModelInstance } from "src/database/interfaces/slot";

export function readAndPublishInMemorySessionMetadataState(
  sessionId: string,
  pubSub: RedisPubSub
) {
  return readInMemorySessionMetadataState(sessionId).then(
    (inMemorySessionMetadataState) =>
      publishInMemorySessionMetadataState(pubSub, inMemorySessionMetadataState)
  );
}

export function readAndPublishInMemoryProfileMetadataState(
  sessionId: string,
  pubSub: RedisPubSub
) {
  return readInMemoryProfileMetadataState(sessionId).then(
    (inMemoryProfileMetadataState) =>
      publishInMemoryProfileMetadataState(pubSub, inMemoryProfileMetadataState)
  );
}

export function dispatchActionForSessionId(
  sessionId: string,
  action: Parameters<Unpack<ReturnType<typeof createInMemoryDispatcher>>>[0]
) {
  return createInMemoryDispatcher(sessionId, { allowNullProfile: true }).then(
    (dispatch) => dispatch(action)
  );
}

export function dispatchActionForSessionIdAndPublishChanges(
  pubSub: RedisPubSub,
  sessionId: string,
  action: Parameters<Unpack<ReturnType<typeof createInMemoryDispatcher>>>[0]
) {
  return dispatchActionForSessionId(sessionId, action).then(
    ([
      inMemorySessionMetadataStateResult,
      inMemoryProfileMetadataStateResult,
    ]) => {
      const inMemorySessionMetadataGraphQLState =
        graphqlInMemorySessionStateSerializer(
          inMemorySessionMetadataStateResult.state
        );
      const inMemoryProfileMetadataGraphQLState =
        graphqlInMemoryProfileStateSerializer(
          inMemoryProfileMetadataStateResult.state
        );
      const ops: [
        Promise<
          readonly [
            InMemorySessionMetadataState,
            InMemorySessionMetadataGraphQLState
          ]
        >,
        Promise<
          readonly [
            InMemoryProfileMetadataState,
            InMemoryProfileMetadataGraphQLState
          ]
        >
      ] = [
        Promise.resolve([
          inMemorySessionMetadataStateResult.state,
          inMemorySessionMetadataGraphQLState,
        ]),
        Promise.resolve([
          inMemoryProfileMetadataStateResult.state,
          inMemoryProfileMetadataGraphQLState,
        ]),
      ];
      if (inMemorySessionMetadataStateResult.hasStateChanged) {
        ops[0] = saveInMemorySessionMetadataState(
          inMemorySessionMetadataStateResult.state
        ).then((inMemorySessionMetadataState) =>
          publishInMemorySessionMetadataState(
            pubSub,
            inMemorySessionMetadataState,
            inMemorySessionMetadataGraphQLState
          )
        );
      }
      if (inMemoryProfileMetadataStateResult.hasStateChanged) {
        ops[1] = saveInMemoryProfileMetadataState(
          inMemoryProfileMetadataStateResult.state
        ).then((inMemoryProfileMetadataState) =>
          publishInMemoryProfileMetadataState(
            pubSub,
            inMemoryProfileMetadataState,
            inMemoryProfileMetadataGraphQLState
          )
        );
      }
      return Promise.all(ops);
    }
  );
}

export function handleSessionSubscriptionForSessionId(
  profileId: string,
  sessionId: string
) {
  return readInMemorySessionMetadataState(sessionId).then(
    (inMemorySessionMetadataState) => {
      if (!inMemorySessionMetadataState) {
        return Promise.reject(
          new Error(InMemorySessionMetadataStateError.SESSION_NOT_FOUND)
        );
      }
      return dispatchActionForSessionId(
        sessionId,
        addConnectedProfile({ ids: profileId })
      )
        .then(
          ([inMemorySessionMetadataResult]) =>
            inMemorySessionMetadataResult.state
        )
        .then((inMemorySessionMetadataState) =>
          saveInMemorySessionMetadataState(inMemorySessionMetadataState)
        );
    }
  );
}

function uniqueConstraintErrorHandler(
  slotWithWorkshopAndActivities: SlotModelInstance,
  profileId: string
): Promise<Readonly<[SessionModelInstance, InMemorySessionMetadataState]>> {
  return models.session
    .findOne({
      where: {
        slot_id: slotWithWorkshopAndActivities.id,
        status: SessionStatus.SCHEDULED,
      },
    })
    .then((session) =>
      readInMemorySessionMetadataState(session!.id).then(
        (inMemorySessionMetadataState) => {
          if (!inMemorySessionMetadataState) {
            const inMemorySessionMetadataState =
              createSessionReducerInitialState({
                sessionId: session!.id,
                activityIds:
                  slotWithWorkshopAndActivities.workshop!.activities!.map(
                    (a) => a.id
                  ),
                profileIds: [
                  "d09c8aec-f7e6-40cf-9d3f-c095074722c6",
                  "d63ebbec-a7a5-4382-be09-d1db4cb9288a",
                ], // All profiles that can access the workshop
                participantProfileIds: [
                  "d09c8aec-f7e6-40cf-9d3f-c095074722c6",
                  "d63ebbec-a7a5-4382-be09-d1db4cb9288a",
                ], // Who is actually participating
                connectedProfileIds: [profileId], // All profiles that are connected
              });
            return [session!, inMemorySessionMetadataState] as const;
          }
          return dispatchActionForSessionId(
            session!.id,
            addConnectedProfile({ ids: profileId })
          ).then(
            ([inMemorySessionMetadataResult]) =>
              [session!, inMemorySessionMetadataResult.state] as const
          );
        }
      )
    );
}

export function handleSessionSubscriptionWithSlotId(
  profileId: string,
  slotId: string
): Promise<InMemorySessionMetadataState> {
  return readSlotWithWorkshopActivitiesAndRelatedQuestions(slotId).then(
    (slotWithWorkshopAndActivities) => {
      if (
        !slotWithWorkshopAndActivities ||
        !slotWithWorkshopAndActivities.isOpenForSession() ||
        !slotWithWorkshopAndActivities.workshop ||
        !slotWithWorkshopAndActivities.workshop.activities ||
        slotWithWorkshopAndActivities.workshop.activities.length === 0
      ) {
        throw new Error(InMemorySessionMetadataStateError.SESSION_NOT_FOUND);
      }
      const slotWorkshopId = slotWithWorkshopAndActivities.workshop_id;
      const slotWorkspaceId = slotWithWorkshopAndActivities.workspace_id;

      const sessionKey = generateSessionKey({ slotId });
      return models.session
        .create({
          status: SessionStatus.SCHEDULED,
          creator_id: profileId,
          slot_id: slotId,
          workshop_id: slotWorkshopId,
          workspace_id: slotWorkspaceId,
          session_key: sessionKey,
        })
        .then((session) =>
          createSessionReducerInitialState({
            sessionId: session.id,
            activityIds:
              slotWithWorkshopAndActivities.workshop!.activities!.map(
                (a) => a.id
              ),
            profileIds: [
              "d09c8aec-f7e6-40cf-9d3f-c095074722c6",
              "d63ebbec-a7a5-4382-be09-d1db4cb9288a",
            ], // All profiles that can access the workshop
            participantProfileIds: [
              "d09c8aec-f7e6-40cf-9d3f-c095074722c6",
              "d63ebbec-a7a5-4382-be09-d1db4cb9288a",
            ], // Who is actually participating
            connectedProfileIds: [profileId], // All profiles that are connected
          })
        )
        .catch((error) => {
          if (error instanceof UniqueConstraintError) {
            return uniqueConstraintErrorHandler(
              slotWithWorkshopAndActivities,
              profileId
            ).then(
              ([, inMemorySessionMetadataState]) => inMemorySessionMetadataState
            );
          }
          return Promise.reject(error);
        });
    }
  );
}

export function handleSessionUnsubscribe(
  profileId: string,
  sessionId: string,
  pubSub: RedisPubSub
) {
  return dispatchActionForSessionIdAndPublishChanges(
    pubSub,
    sessionId,
    removeConnectedProfile({ ids: profileId })
  );
}

export function handleMutationAction(
  sessionId: string,
  action: InMemoryMetadataActions,
  pubSub: RedisPubSub
) {
  return createInMemoryDispatcher(sessionId)
    .then((dispatcher) => dispatcher(action))
    .then(
      ([
        {
          state: inMemorySessionMetadataState,
          hasStateChanged: hasStateSessionChanged,
        },
        {
          state: inMemoryProfileMetadataState,
          hasStateChanged: hasProfileStateChanged,
        },
      ]) => {
        const inMemorySessionMetadataGraphQLState =
          graphqlInMemorySessionStateSerializer(inMemorySessionMetadataState);
        const inMemoryProfileMetadataGraphQLState =
          graphqlInMemoryProfileStateSerializer(inMemoryProfileMetadataState);
        const ops: [
          [InMemorySessionMetadataState, InMemorySessionMetadataGraphQLState],
          [InMemoryProfileMetadataState, InMemoryProfileMetadataGraphQLState]
        ] = [
          [inMemorySessionMetadataState, inMemorySessionMetadataGraphQLState],
          [inMemoryProfileMetadataState, inMemoryProfileMetadataGraphQLState],
        ];
        if (hasStateSessionChanged) {
          ops[0] = [
            ...publishInMemorySessionMetadataState(
              pubSub,
              inMemorySessionMetadataState
            ),
          ];
        }
        if (hasProfileStateChanged) {
          ops[1] = [
            ...publishInMemoryProfileMetadataState(
              pubSub,
              inMemoryProfileMetadataState
            ),
          ];
        }
        return ops;
      }
    );
}
