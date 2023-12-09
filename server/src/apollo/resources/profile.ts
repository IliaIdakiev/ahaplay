import gql from "graphql-tag";
import {
  ProfileModelInstance,
  ProfileWorkspaceAccess,
  ProfileWorkspaceStatus,
  WorkspaceModelInstance,
  domainAssociationNames,
  models,
  workspaceAssociationNames,
  workspaceProfileAssociationNames,
} from "../../database";
import { getRequestedFields } from "../utils";
import { Includeable } from "sequelize";
import { AppContext } from "../types";
import { createToken } from "../../modules";
import { AuthJwtPayload } from "../../types";

interface ProfileWorkspaceResult {
  workspace_id: string;
  profile_id: string;
  access: ProfileWorkspaceAccess;
  status: ProfileWorkspaceStatus;
  title: string;
  workspace?: WorkspaceModelInstance;
}

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
  workspaces: ProfileWorkspaceResult[];
}

function prepareProfileResult(
  profile: ProfileModelInstance | null
): ProfileResult | null {
  if (!profile) return null;
  const { workspaceProfiles, ...data } = profile.dataValues;
  return {
    ...data,
    workspaces: (workspaceProfiles || []).map((item) => {
      const result: ProfileWorkspaceResult = {
        profile_id: item.profile_id,
        workspace_id: item.workspace_id,
        workspace: item.workspace,
        access: item.access,
        status: item.status,
        title: item.title,
      };

      return result;
    }),
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

  type LoginResult {
    profile: Profile
    token: String
  }

  type Mutation {
    registerProfile(
      email: String!
      headline: String
      image: String
      name: String!
      password: String!
    ): Profile

    login(email: String!, password: String!): LoginResult!

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
  const includeWorkspaceDomains = includeWorkspace
    ? requestedFields[workspaceAssociationNames.plural][
        workspaceAssociationNames.singular
      ][domainAssociationNames.plural]
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
    return models.profile
      .findAll({ where: { ...data }, include })
      .then((results) => results.map(prepareProfileResult));
  },
};

export const profileMutationResolvers = {
  registerProfile(
    _: undefined,
    data: {
      email: string;
      password: string;
      name: string;
      title?: string;
    },
    contextValue: AppContext,
    info: any
  ) {
    const { origin } = contextValue;
    return models.domain
      .findOne({
        where: { domain: origin },
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

        if (
          !domain ||
          !domain.workspace ||
          !domain.workspace.domains ||
          domain.workspace.domains.length === 0 ||
          !domain.workspace.domains.find((d) => {
            const domainMatch = email.match(/@([^@]+)$/) || [];
            const emailDomain = domainMatch[1];
            return typeof emailDomain === "string" && emailDomain === d.domain;
          })
        )
          return null;

        return models.profile
          .findOne({
            where: { email },
            include: [
              {
                model: models.workspaceProfile,
                as: workspaceProfileAssociationNames.plural,
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
            if (!existingUser)
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
                      newProfile.workspaceProfiles = [workspaceProfile];

                      newProfile.dataValues.workspaceProfiles =
                        newProfile.workspaceProfiles;
                      return prepareProfileResult(newProfile);
                    })
                );

            return existingUser
              .authenticate(password)
              .then((isAuthenticated) =>
                isAuthenticated ? prepareProfileResult(existingUser) : null
              );
          });
      });
  },
  login(
    _: undefined,
    data: {
      email: string;
      password: string;
    },
    contextValue: AppContext,
    info: any
  ): Promise<{ profile: ProfileResult; token: string } | null> {
    const { origin } = contextValue;
    const { email, password } = data;
    return models.profile
      .findOne({
        where: { email },
        include: [
          {
            model: models.workspaceProfile,
            as: workspaceProfileAssociationNames.plural,
            include: [
              {
                model: models.workspace,
                as: workspaceAssociationNames.singular,
                include: [
                  {
                    model: models.domain,
                    as: domainAssociationNames.plural,
                    where: { domain: origin },
                  },
                ],
              },
            ],
          },
        ],
      })
      .then((foundProfile) =>
        foundProfile
          ? foundProfile
              .authenticate(password)
              .then((isAuthenticated) =>
                isAuthenticated
                  ? createToken<AuthJwtPayload>({
                      email: foundProfile.email,
                      id: foundProfile.id,
                      image: foundProfile.image,
                      name: foundProfile.name,
                    })
                  : null
              )
              .then((token) => {
                if (!token) return null;
                return [foundProfile, token] as const;
              })
          : null
      )
      .then((result) => {
        if (!result) return null;
        const responseData = {
          profile: prepareProfileResult(result[0])!,
          token: result[1]!,
        };
        return responseData;
      });
  },
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
          models.profile
            .findByPk(profile.id, { include })
            .then(prepareProfileResult)
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
      return profile.destroy().then(() => prepareProfileResult(profile));
    });
  },
};
