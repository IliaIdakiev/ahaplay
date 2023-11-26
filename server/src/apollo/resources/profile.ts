import gql from "graphql-tag";
import {
  ProfileWorkspaceAccess,
  ProfileWorkspaceStatus,
  models,
  workspaceAssociationNames,
  workspaceProfileAssociationNames,
} from "../../database";
import { extractRequestedFieldsFromInfo, getRequestedFields } from "../utils";
import { Includeable } from "sequelize";

export const profileTypeDefs = gql`
  enum ProfileWorkspaceAccess {
    ADMIN
    SUPER_ADMIN
    TEAM_MEMBER
    OWNER
    NONE
  }

  enum ProfileWorkspaceStatus {
    ACTIVE
    LEFT
    UNSUBSCRIBED
    ABSENCE
    PROHIBITED
    NONE
  }

  type ProfileWorkspace {
    workspace_id: String!
    profile_id: String!
    access: ProfileWorkspaceAccess!
    status: ProfileWorkspaceStatus!
    title: String
    workspace: Workspace
  }

  type Profile {
    id: String!
    create_date: Date!
    update_date: Date!
    email: String!
    headline: String
    image: String
    login_date: Date
    name: String!
    is_completed: Boolean!

    workspaces: [ProfileWorkspace]
  }
`;

export const profileQueryDefs = gql`
  extend type Query {
    getProfiles(id: String, email: String): [Profile]
  }
`;

export const profileMutationDefs = gql`
  input WorkspaceProfileInput {
    workspaceId: String!
    access: ProfileWorkspaceAccess!
    status: ProfileWorkspaceStatus!
    title: String
  }

  type Mutation {
    createProfile(
      email: String!
      headline: String
      image: String
      name: String!
      password: String!
      workspaces: [WorkspaceProfileInput]
    ): Profile!

    deleteProfile(id: String!): Profile!
  }
`;

function prepareIncludesFromInfo(info: any) {
  const requestedFields = getRequestedFields(info);
  const includeWorkspaceProfile =
    requestedFields[workspaceAssociationNames.plural];
  const includeWorkspace = includeWorkspaceProfile
    ? requestedFields[workspaceAssociationNames.plural][
        workspaceAssociationNames.singular
      ]
    : false;

  const includes: Includeable[] = [];

  if (includeWorkspaceProfile) {
    let include: Includeable = {
      model: models.workspaceProfile,
      as: workspaceProfileAssociationNames.plural,
    };
    if (includeWorkspace) {
      include = {
        model: models.workspaceProfile,
        as: workspaceProfileAssociationNames.plural,
        include: [
          {
            model: models.workspace,
            as: workspaceAssociationNames.singular,
          },
        ],
      };
    }
    includes.push(include);
  }

  return includes;
}

export const profileQueryResolvers = {
  getProfiles(
    _: undefined,
    data: { id: string; email: string },
    contextValue: any,
    info: any
  ) {
    const include = prepareIncludesFromInfo(info);
    return models.profile.findAll({ where: { ...data }, include });
  },
};

export const profileMutationResolvers = {
  createProfile(
    _: undefined,
    data: {
      email: string;
      headline: string;
      image: string;
      name: string;
      password: string;
      workspaces: {
        workspaceId: string;
        access: ProfileWorkspaceAccess;
        status: ProfileWorkspaceStatus;
        title: string;
      }[];
      is_completed: boolean;
    },
    contextValue: any,
    info: any
  ) {
    const include = prepareIncludesFromInfo(info);
    const { workspaces, ...profileData } = data;
    return models.profile
      .create(profileData, {
        returning: true,
      })
      .then((profile) =>
        (workspaces && workspaces.length > 0
          ? models.workspaceProfile.bulkCreate(
              workspaces.map((item) => ({
                workspace_id: item.workspaceId,
                profile_id: profile.id,
                status: item.status,
                access: item.access,
                title: item.title,
              }))
            )
          : Promise.resolve()
        ).then((workspaceProfiles) =>
          models.profile.findByPk(profile.id, { include })
        )
      );
  },
  deleteProfile(
    _: undefined,
    data: {
      id: string;
    },
    contextValue: any,
    info: any
  ) {
    const { id } = data;
    const include = prepareIncludesFromInfo(info);
    return models.profile.findByPk(id, { include }).then((profile) => {
      if (!profile) {
        return null;
      }
      return profile.destroy().then(() => profile);
    });
  },
};
