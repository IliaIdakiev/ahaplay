import gql from "graphql-tag";
import {
  ProfileModelInstance,
  ProfileWorkspaceAccess,
  ProfileWorkspaceStatus,
  domainAssociationNames,
  models,
  workspaceAssociationNames,
  workspaceProfileAssociationNames,
} from "../../database";
import { getRequestedFields } from "../utils";
import { Includeable } from "sequelize";
import {
  AppContext,
  AuthenticatedAppContext,
  ProfileWorkspace,
} from "../types";
import { createToken } from "../../modules";
import { AuthJwtPayload } from "../../types";
import { authorize } from "../middleware/authorize";
import { authenticate } from "../middleware/authenticate";
import { noAuthenticate } from "../middleware/no-authenticate";
import { getEmailDomain } from "./utils";
import { LoginError, RegistrationError } from "../../errors";

interface ProfileResult {
  id: string;
  create_date: Date;
  update_date: Date;
  email: string;
  headline: string;
  image: string;
  login_date: Date;
  name: string;
  is_completed: boolean;
  workspace: ProfileWorkspace | null;
}

function prepareProfileResult(
  profile: ProfileModelInstance | null
): ProfileResult | null {
  if (!profile) return null;
  const { workspaceProfile, ...data } = profile.dataValues;
  return {
    ...data,
    workspace: workspaceProfile
      ? {
          profile_id: workspaceProfile.profile_id,
          workspace_id: workspaceProfile.workspace_id,
          workspace: workspaceProfile.workspace,
          access: workspaceProfile.access,
          status: workspaceProfile.status,
          title: workspaceProfile.title,
        }
      : null,
  };
}

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
    name: String!
    is_completed: Boolean!

    login_date: Date
    headline: String
    image: String
    workspace: ProfileWorkspace
  }
`;

export const profileQueryDefs = gql`
  extend type Query {
    getProfiles(workspace_id: String, id: String, email: String): [Profile]
    getMyProfile: Profile
  }
`;

export const profileMutationDefs = gql`
  input WorkspaceProfileInput {
    access: ProfileWorkspaceAccess!
    status: ProfileWorkspaceStatus!
    title: String
  }

  type LoginResult {
    profile: Profile
    token: String
  }

  type RegisterResult {
    email: String
    name: String
  }

  type Mutation {
    registerProfile(
      email: String!
      password: String!
      name: String!
      title: String
      headline: String
      image: String
    ): RegisterResult!

    login(email: String!, password: String!): LoginResult!

    createProfile(
      email: String!
      name: String!
      password: String!
      workspace_id: String!
      workspace: WorkspaceProfileInput!
      headline: String
      image: String
    ): Profile

    deleteProfile(workspace_id: String!, id: String!): Profile
  }
`;

function prepareIncludesFromInfo(
  info: any,
  config: { workspace_id?: string; isMasterAccount?: boolean }
) {
  const requestedFields = getRequestedFields(info);
  const includeWorkspaceProfile =
    requestedFields[workspaceAssociationNames.singular];
  const includeWorkspace = includeWorkspaceProfile
    ? requestedFields[workspaceAssociationNames.singular][
        workspaceAssociationNames.singular
      ]
    : false;
  const includeWorkspaceDomains = includeWorkspace
    ? requestedFields[workspaceAssociationNames.singular][
        workspaceAssociationNames.singular
      ][domainAssociationNames.plural]
    : false;

  const includes: Includeable[] = [];

  let include: Includeable = {
    model: models.workspaceProfile,
    as: workspaceProfileAssociationNames.singular,
  };

  if (!config.isMasterAccount) {
    include.where = {
      workspace_id: config.workspace_id,
    };
  }

  if (includeWorkspace) {
    include = {
      model: models.workspaceProfile,
      as: workspaceProfileAssociationNames.singular,
      include: [
        {
          model: models.workspace,
          as: workspaceAssociationNames.singular,
          include: includeWorkspaceDomains
            ? [
                {
                  model: models.domain,
                  as: domainAssociationNames.plural,
                },
              ]
            : [],
        },
      ],
    };
  }
  includes.push(include);

  return includes;
}

export const profileQueryResolvers = {
  getProfiles: authorize({
    allowedWorkspaceAccess: [ProfileWorkspaceAccess.ADMIN],
  })(
    (
      _: undefined,
      data: { id: string; email: string },
      contextValue: AuthenticatedAppContext,
      info: any
    ) => {
      const include = prepareIncludesFromInfo(info, {
        isMasterAccount: !!contextValue.isMaster,
        // workspace_id: contextValue.decodedProfileData.workspace.workspace_id,
      });
      return models.profile
        .findAll({ where: { ...data }, include })
        .then((results) => results.map(prepareProfileResult));
    }
  ),
  getMyProfile: authenticate(
    (_: undefined, data: void, contextValue: AppContext, info: any) => {
      const {
        id: profileId,
        email,
        workspace,
      } = contextValue.decodedProfileData || {};
      // const include = prepareIncludesFromInfo(info, workspace!.workspace_id);
      // return models.profile
      //   .findAll({ where: { ...data }, include })
      //   .then((results) => results.map(prepareProfileResult));
    }
  ),
};

export const profileMutationResolvers = {
  registerProfile: noAuthenticate(
    (
      _: undefined,
      data: {
        email: string;
        password: string;
        name: string;
        title?: string;
        headline?: String;
        image?: String;
      },
      contextValue: AppContext,
      info: any
    ) => {
      const domain = getEmailDomain(data.email);
      return models.domain
        .findOne({
          where: { domain },
          include: [
            {
              model: models.workspace,
              as: workspaceAssociationNames.singular,
              include: [
                {
                  model: models.domain,
                  as: domainAssociationNames.plural,
                },
              ],
            },
          ],
        })
        .then((domain) => {
          const { email, password, name } = data;

          if (!domain || !domain.workspace)
            throw new Error(RegistrationError.MISSING_WORKSPACE);

          return models.profile
            .findOne({
              where: { email },
              include: [
                {
                  model: models.workspaceProfile,
                  as: workspaceProfileAssociationNames.singular,
                  include: [
                    {
                      model: models.workspace,
                      as: workspaceAssociationNames.singular,
                    },
                  ],
                },
              ],
            })
            .then((existingUser) => {
              if (existingUser) return { email: data.email, name: data.name };
              return models.profile
                .create({
                  email,
                  name,
                  password,
                  is_completed: false,
                })
                .then((newProfile) =>
                  models.workspaceProfile
                    .create({
                      profile_id: newProfile.id,
                      workspace_id: domain.workspace!.id,
                      access: ProfileWorkspaceAccess.TEAM_MEMBER,
                      status: ProfileWorkspaceStatus.ACTIVE,
                      title: data.title || "",
                    })
                    .then((workspaceProfile) => {
                      workspaceProfile.workspace_id = domain.workspace!.id;
                      workspaceProfile.workspace = domain.workspace!;
                      newProfile.workspaceProfile = workspaceProfile;

                      newProfile.dataValues.workspaceProfile =
                        newProfile.workspaceProfile;
                      return { email: data.email, name: data.name };
                    })
                );
            });
        });
    }
  ),
  login: noAuthenticate(
    (
      _: undefined,
      data: {
        email: string;
        password: string;
      },
      contextValue: AppContext,
      info: any
    ): Promise<{ profile: ProfileResult; token: string } | null> => {
      const domain = getEmailDomain(data.email);
      const { email, password } = data;
      return models.profile
        .findOne({
          where: { email, is_completed: true },
          include: [
            {
              model: models.workspaceProfile,
              as: workspaceProfileAssociationNames.singular,
              include: [
                {
                  model: models.workspace,
                  as: workspaceAssociationNames.singular,
                  include: [
                    {
                      model: models.domain,
                      as: domainAssociationNames.plural,
                      where: { domain },
                    },
                  ],
                },
              ],
            },
          ],
        })
        .then((foundProfile) => {
          if (!foundProfile) throw new Error(LoginError.NOT_FOUND);
          return foundProfile.authenticate(password).then((isAuthenticated) => {
            if (!isAuthenticated) throw new Error(LoginError.NOT_FOUND);
            const profileResult = prepareProfileResult(foundProfile)!;
            return createToken<AuthJwtPayload>({
              email: foundProfile.email,
              id: foundProfile.id,
              image: foundProfile.image,
              name: foundProfile.name,
              workspace: profileResult!.workspace!,
            }).then((token) => ({ profile: profileResult, token }));
          });
        });
    }
  ),
  createProfile: authorize({
    allowedWorkspaceAccess: [ProfileWorkspaceAccess.ADMIN],
  })(
    (
      _: undefined,
      data: {
        email: string;
        headline: string;
        image: string;
        name: string;
        password: string;
        workspace_id: string;
        workspace: {
          access: ProfileWorkspaceAccess;
          status: ProfileWorkspaceStatus;
          title: string;
        };
        is_completed: boolean;
      },
      contextValue: any,
      info: any
    ) => {
      const { workspace, workspace_id, ...profileData } = data;
      const include = prepareIncludesFromInfo(info, {
        isMasterAccount: !!contextValue.isMaster,
        workspace_id: contextValue.decodedProfileData.workspace.workspace_id,
      });
      return models.profile
        .create(profileData, {
          returning: true,
        })
        .then((profile) =>
          models.workspaceProfile
            .create({
              workspace_id,
              profile_id: profile.id,
              status: workspace.status,
              access: workspace.access,
              title: workspace.title,
            })
            .then(() =>
              models.profile
                .findByPk(profile.id, { include })
                .then(prepareProfileResult)
            )
        );
    }
  ),
  deleteProfile: authorize({
    allowedWorkspaceAccess: [ProfileWorkspaceAccess.ADMIN],
  })(
    (
      _: undefined,
      data: {
        id: string;
        workspace_id: string;
      },
      contextValue: any,
      info: any
    ) => {
      const { id, workspace_id } = data;
      const include = prepareIncludesFromInfo(info, {
        isMasterAccount: !!contextValue.isMaster,
        workspace_id: contextValue.decodedProfileData.workspace.workspace_id,
      });
      return models.profile.findByPk(id, { include }).then((profile) => {
        if (!profile) {
          return null;
        }
        return profile.destroy().then(() => prepareProfileResult(profile));
      });
    }
  ),
};
