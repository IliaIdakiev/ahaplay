import gql from "graphql-tag";
import {
  DomainModelInstance,
  ProfileModelInstance,
  ProfileWorkspaceAccess,
  ProfileWorkspaceStatus,
  WorkspaceAttributes,
  WorkspaceModelInstance,
  WorkspaceProfileModelInstance,
  domainAssociationNames,
  models,
  profileAssociationNames,
  workspaceProfileAssociationNames,
} from "../../database";
import { getRequestedFields } from "../utils";
import { Includeable, Op } from "sequelize";
import { sequelize } from "../../database";

interface GraphQLWorkspace {
  id?: string;
  image?: string;
  workspace_key?: string;
  name?: string;
  domains?: { domain?: string }[];
  profiles?: {
    id?: string;
    access?: ProfileWorkspaceAccess;
    status?: ProfileWorkspaceStatus;
    title?: string;
    profile?: ProfileModelInstance;
  }[];
  create_date?: Date;
  update_date?: Date;
}

export const workspaceTypeDefs = gql`
  type Domain {
    domain: String
  }

  type WorkspaceProfile {
    id: String!
    access: ProfileWorkspaceAccess!
    status: ProfileWorkspaceStatus!
    title: String
    profile: Profile
  }

  type Workspace {
    id: String!
    image: String
    workspace_key: String
    name: String!
    domains: [Domain]!
    profiles: [WorkspaceProfile]
    create_date: Date
    update_date: Date
  }
`;
export const workspaceQueryDefs = gql`
  extend type Query {
    getWorkspaces(id: String, name: String, domain: String): [Workspace]
  }
`;

export const workspaceMutationDefs = gql`
  input DomainInput {
    domain: String
  }

  input ProfileInput {
    id: String
    access: ProfileWorkspaceAccess
    status: ProfileWorkspaceStatus
    title: String
  }

  type Mutation {
    createWorkspace(
      image: String
      name: String!
      domains: [DomainInput]
      profiles: [ProfileInput]
    ): Workspace!
    updateWorkspace(
      id: String!
      image: String
      name: String
      domains: [DomainInput]
      profiles: [ProfileInput]
    ): Workspace
    deleteWorkspace(id: String!): Workspace
  }
`;

function prepareIncludesFromInfo(info: any) {
  const requestedFields = getRequestedFields(info);
  const includeProfiles = !!requestedFields.profiles;
  const includeProfilesProfile = !!requestedFields.profiles?.profile;
  const includeDomains = !!requestedFields.domains;

  const include: Includeable[] = [];

  if (includeProfiles) {
    const workspaceProfileInclude = {
      model: models.workspaceProfile,
      as: workspaceProfileAssociationNames.plural,
      include: [] as Includeable[],
    };
    if (includeProfilesProfile) {
      workspaceProfileInclude.include = [
        {
          model: models.profile,
          as: profileAssociationNames.singular,
        },
      ];
    }
    include.push(workspaceProfileInclude);
  }

  if (includeDomains) {
    include.push({
      model: models.domain,
      as: domainAssociationNames.plural,
    });
  }

  return include;
}

function generateResult(
  workspace: WorkspaceModelInstance,
  domains?: DomainModelInstance[],
  workspaceProfiles?: WorkspaceProfileModelInstance[]
): GraphQLWorkspace {
  const {
    domains: workspaceDomains,
    workspaceProfiles: workspaceWorkspaceProfiles,
    ...others
  } = workspace.dataValues;
  const domainsResult =
    domains ||
    (Array.isArray(workspaceDomains)
      ? workspaceDomains!.map(({ domain }) => ({ domain: domain }))
      : []);

  const profileResult = workspaceProfiles || workspaceWorkspaceProfiles;

  let result: GraphQLWorkspace = {
    ...others,
  };
  if (domainsResult) {
    result = {
      ...result,
      domains: domainsResult,
    };
  }
  if (profileResult) {
    result = {
      ...result,
      profiles: profileResult,
    };
  }
  return {
    ...result,
    create_date: workspace.create_date,
    update_date: workspace.update_date,
  };
}

export const workspaceQueryResolvers = {
  getWorkspaces(
    _: undefined,
    data: { id: string; email: string },
    contextValue: any,
    info: any
  ) {
    const include = prepareIncludesFromInfo(info);
    return models.workspace
      .findAll({ where: { ...data }, include })
      .then((workspaces) =>
        workspaces.map((workspace) => generateResult(workspace))
      );
  },
};

export const workspaceMutationResolvers = {
  createWorkspace(
    _: undefined,
    data: {
      image?: string;
      name: string;
      domains?: { domain: string }[];
      profiles?: {
        id: string;
        access: ProfileWorkspaceAccess;
        status: ProfileWorkspaceStatus;
        title: string;
      }[];
    },
    contextValue: any,
    info: any
  ) {
    const requestedFields = getRequestedFields(info);
    const { domains, profiles, ...workspaceData } = data;
    return models.workspace
      .create(workspaceData, { returning: true })
      .then((workspace) => {
        return Promise.all([
          domains && domains?.length > 0
            ? models.domain.bulkCreate(
                domains.map((d) => ({ ...d, workspace_id: workspace.id }))
              )
            : [],
          profiles && profiles.length > 0
            ? models.workspaceProfile
                .bulkCreate(
                  profiles.map(({ id, access, status, title }) => ({
                    profile_id: id,
                    workspace_id: workspace.id,
                    access,
                    status,
                    title,
                  }))
                )
                .then((workspaceProfiles) =>
                  requestedFields.profiles
                    ? Promise.all(
                        workspaceProfiles.map((wp) =>
                          wp.getProfile().then((profile) => {
                            wp.profile = profile;
                            return wp;
                          })
                        )
                      )
                    : []
                )
            : [],
        ]).then(([domains, workspaceProfiles]) => {
          const result = generateResult(workspace, domains, workspaceProfiles);
          return result;
        });
      });
  },
  updateWorkspace(
    _: undefined,
    data: {
      id: string;
      image: string;
      name: string;
      domains: { id?: string; domain: string }[];
      profiles: {
        id: string;
        access: ProfileWorkspaceAccess;
        status: ProfileWorkspaceStatus;
        title: string;
      }[];
    },
    contextValue: any,
    info: any
  ) {
    const requestedFields = getRequestedFields(info);
    const { domains, profiles, ...workspaceData } = data;
    const includes: Includeable[] = [];
    if (profiles) {
      includes.push({
        model: models.workspaceProfile,
        as: workspaceProfileAssociationNames.plural,
      });
    }
    if (domains) {
      includes.push({
        model: models.domain,
        as: domainAssociationNames.plural,
      });
    }

    return models.workspace
      .findByPk(data.id, {
        include: includes,
      })
      .then((workspace) => {
        if (!workspace) {
          return null;
        }
        return sequelize.transaction((t) => {
          const profileIdsForUpdate: string[] = [];

          const includeProfile = !!requestedFields?.profiles?.profile;

          const existingInputDomains = domains.filter((val) =>
            workspace.domains?.find((d) => d.domain === val.domain)
          );
          const existingDomains = existingInputDomains.map(
            (d) => workspace.domains?.find((wd) => wd.domain === d.domain)!
          );
          const newInputDomains = domains.filter(
            (val) => !existingInputDomains.find((d) => d.domain === val.domain)
          );
          const deletedDomains = workspace.domains?.filter(
            (v) => !existingInputDomains.find((d) => d.domain === v.domain)
          );

          const domainCreationPromise: Promise<DomainModelInstance[]> =
            newInputDomains
              ? models.domain.bulkCreate(
                  newInputDomains.map((d) => ({
                    domain: d.domain,
                    workspace_id: workspace.id,
                  })),
                  { transaction: t, returning: true }
                )
              : Promise.resolve([]);

          const domainDeletionPromise = deletedDomains
            ? models.domain.destroy({
                where: {
                  domain: { [Op.in]: deletedDomains.map((d) => d.domain) },
                },
                individualHooks: true,
                transaction: t,
              })
            : Promise.resolve([]);

          const updateExistingWorkspaceProfilePromises = (
            workspace.workspaceProfiles || []
          ).map((wp) => {
            const currentWorkspaceProfileUpdate = profiles.find(
              (p) => p.id === wp.id
            );
            if (!currentWorkspaceProfileUpdate) {
              return wp.destroy({ transaction: t }).then(() => null);
            }
            Object.entries(currentWorkspaceProfileUpdate).forEach(
              ([key, value]) => {
                wp.set(key as any, value);
              }
            );
            profileIdsForUpdate.push(currentWorkspaceProfileUpdate.id);

            return wp.changed()
              ? wp.save({ transaction: t }).then((wp) => {
                  if (includeProfile) {
                    return models.profile
                      .findByPk(wp.profile_id)
                      .then((profile) => {
                        wp.profile = profile || undefined;
                        return wp;
                      });
                  }
                  return wp;
                })
              : Promise.resolve(wp);
          });
          const newWorkspaceProfiles = profiles.filter(
            (p) => !profileIdsForUpdate.includes(p.id)
          );
          const createNewWorkspaceProfilePromises = newWorkspaceProfiles.map(
            ({ id, access, status, title }) =>
              models.workspaceProfile
                .create(
                  {
                    profile_id: id,
                    access,
                    status,
                    title,
                    workspace_id: workspace.id,
                  },
                  { transaction: t }
                )
                .then((wp) => {
                  if (includeProfile) {
                    return models.profile
                      .findByPk(wp.profile_id)
                      .then((profile) => {
                        wp.profile = profile || undefined;
                        return wp;
                      });
                  }
                  return wp;
                })
          );

          for (const [key, value] of Object.entries(workspaceData)) {
            workspace.set(key as keyof WorkspaceAttributes, value);
          }

          return Promise.all([
            workspace.changed()
              ? workspace.save({ transaction: t })
              : workspace,
            Promise.all(updateExistingWorkspaceProfilePromises),
            Promise.all(createNewWorkspaceProfilePromises),
            existingDomains,
            domainCreationPromise,
            domainDeletionPromise,
          ]);
        });
      })
      .then((results) => {
        if (results === null) {
          return null;
        }
        const [
          workspace,
          updatedWorkspaceProfiles,
          newWorkspaceProfiles,
          existingDomains,
          createdDomains,
        ] = results;

        const allWorkspaceDomains = [...existingDomains, ...createdDomains];

        const allWorkspaceProfiles = [
          ...updatedWorkspaceProfiles,
          ...newWorkspaceProfiles,
        ].filter((val) => val !== null) as WorkspaceProfileModelInstance[];

        const result = generateResult(
          workspace,
          allWorkspaceDomains,
          allWorkspaceProfiles
        );
        return result;
      });
  },
  deleteWorkspace(
    _: undefined,
    data: {
      id: string;
    },
    contextValue: any,
    info: any
  ) {
    const id = data.id;
    const include = prepareIncludesFromInfo(info);
    return models.workspace.findByPk(id, { include }).then((workspace) => {
      if (!workspace) {
        return workspace;
      }

      return workspace
        .getDomains()
        .then((domains) => Promise.all(domains.map((d) => d.destroy())))
        .then(() => workspace.destroy())
        .then(() => {
          const result = generateResult(workspace);
          return result;
        });
    });
  },
};
