import gql from "graphql-tag";
import {
  DomainModelInstance,
  ProfileModelInstance,
  ProfileWorkspaceAccess,
  ProfileWorkspaceStatus,
  WorkspaceModelInstance,
  WorkspaceProfileAttributes,
  WorkspaceProfileModelInstance,
  domainAssociationNames,
  models,
  profileAssociationNames,
  workspaceProfileAssociationNames,
} from "../../database";
import { getRequestedFields } from "../utils";
import { Includeable } from "sequelize";
import { sequelize } from "../../database";
import { authorize } from "../middleware/authorize";

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
      as: workspaceProfileAssociationNames.singular,
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
  getWorkspaces: authorize({ masterOnly: true })(
    (
      _: undefined,
      data: { id: string; email: string },
      contextValue: any,
      info: any
    ) => {
      const include = prepareIncludesFromInfo(info);
      return models.workspace
        .findAll({ where: { ...data }, include })
        .then((workspaces) =>
          workspaces.map((workspace) => generateResult(workspace))
        );
    }
  ),
};

export const workspaceMutationResolvers = {
  createWorkspace: authorize({ masterOnly: true })(
    (
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
    ) => {
      const requestedFields = getRequestedFields(info);
      const { domains, profiles, ...workspaceData } = data;
      return sequelize.transaction((t) => {
        return models.workspace
          .create(workspaceData, { returning: true, transaction: t })
          .then((workspace) => {
            return Promise.all([
              domains && domains?.length > 0
                ? models.domain.bulkCreate(
                    domains.map((d) => ({ ...d, workspace_id: workspace.id })),
                    { returning: true, transaction: t }
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
                      })),
                      { returning: true, transaction: t }
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
              const result = generateResult(
                workspace,
                domains,
                workspaceProfiles
              );
              return result;
            });
          });
      });
    }
  ),
  updateWorkspace: authorize({ masterOnly: true })(
    (
      _: undefined,
      data: {
        id: string;
        image?: string;
        name?: string;
        domains?: { id?: string; domain: string }[];
        profiles?: {
          id: string;
          access: ProfileWorkspaceAccess;
          status: ProfileWorkspaceStatus;
          title: string;
        }[];
      },
      contextValue: any,
      info: any
    ) => {
      const include = prepareIncludesFromInfo(info);
      const { domains, profiles } = data;

      return models.workspace
        .findByPk(data.id, {
          include: [
            { model: models.domain, as: domainAssociationNames.plural },
            {
              model: models.workspaceProfile,
              as: workspaceProfileAssociationNames.singular,
            },
          ],
        })
        .then((workspace) => {
          if (!workspace) return null;

          const currentDomains = workspace.domains!;
          const alreadyExistingInputDomains = domains
            ? currentDomains.filter((d) =>
                domains.find((dd) => dd.domain === d.domain)
              )
            : currentDomains;
          const removedInputDomains = domains
            ? currentDomains.filter(
                (d) => !domains.find((dd) => dd.domain === d.domain)
              )
            : [];
          const newInputDomains = domains
            ? domains.filter(
                (d) =>
                  !alreadyExistingInputDomains.find(
                    (dd) => dd.domain === d.domain
                  ) && !removedInputDomains.find((dd) => dd.domain === d.domain)
              )
            : [];

          const currentWorkspaceProfiles = workspace.workspaceProfiles!;
          const alreadyExistingWorkspaceProfiles = profiles
            ? currentWorkspaceProfiles.filter((cwp) =>
                profiles.find((p) => p.id === cwp.profile_id)
              )
            : currentWorkspaceProfiles;
          const removedWorkspaceProfiles = profiles
            ? currentWorkspaceProfiles.filter(
                (cwp) => !profiles.find((p) => p.id === cwp.profile_id)
              )
            : [];
          const newWorkspaceProfiles = profiles
            ? profiles.filter(
                (p) =>
                  !alreadyExistingWorkspaceProfiles.find(
                    (wp) => wp.id === p.id
                  ) && !removedWorkspaceProfiles.find((wp) => wp.id === p.id)
              )
            : [];

          return sequelize
            .transaction((t) => {
              // Process new input domains
              const newInputsDomainPromise =
                newInputDomains.length > 0
                  ? models.domain.bulkCreate(
                      newInputDomains.map((d) => ({
                        domain: d.domain,
                        workspace_id: workspace.id,
                      })),
                      { transaction: t, returning: true }
                    )
                  : Promise.resolve([]);
              // Process removed input domains
              const removedInputDomainsPromise =
                removedInputDomains.length > 0
                  ? Promise.all(
                      removedInputDomains.map((d) =>
                        d.destroy({ transaction: t }).then(() => d)
                      )
                    )
                  : Promise.resolve([]);

              // Process new workspace profiles
              const newWorkspaceProfilesPromise =
                newWorkspaceProfiles.length > 0
                  ? models.workspaceProfile.bulkCreate(
                      newWorkspaceProfiles.map((wp) => ({
                        workspace_id: workspace.id,
                        access: wp.access,
                        status: wp.status,
                        profile_id: wp.id,
                        title: wp.title,
                      })),
                      { transaction: t, returning: true }
                    )
                  : Promise.resolve([]);
              // Process removed workspace profiles
              const removedWorkspaceProfilePromise =
                removedWorkspaceProfiles.length > 0
                  ? Promise.all(
                      removedWorkspaceProfiles.map((wp) =>
                        wp.destroy({ transaction: t }).then(() => wp)
                      )
                    )
                  : Promise.resolve([]);
              // Process existing workspace profiles
              const existingWorkspaceProfilesPromise =
                alreadyExistingWorkspaceProfiles.length > 0
                  ? alreadyExistingWorkspaceProfiles.map((wp) => {
                      const wpFromInput = profiles?.find(
                        (p) => p.id === wp.profile_id
                      );
                      if (!wpFromInput) return Promise.resolve(wp);
                      for (const [key, value] of Object.entries(wpFromInput)) {
                        wp.set(key as keyof WorkspaceProfileAttributes, value);
                      }
                      return wp.changed()
                        ? wp.save({ transaction: t })
                        : Promise.resolve(wp);
                    })
                  : Promise.resolve([]);

              return Promise.all([
                workspace,
                newInputsDomainPromise,
                removedInputDomainsPromise,
                newWorkspaceProfilesPromise,
                removedWorkspaceProfilePromise,
                existingWorkspaceProfilesPromise,
              ]);
            })
            .then(([workspace]) =>
              models.workspace.findByPk(workspace.id, { include })
            )
            .then((workspace) => {
              if (!workspace) return null;
              const result = generateResult(workspace);
              return result;
            });
        });
    }
  ),
  deleteWorkspace: authorize({ masterOnly: true })(
    (
      _: undefined,
      data: {
        id: string;
      },
      contextValue: any,
      info: any
    ) => {
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
    }
  ),
};
