import gql from "graphql-tag";
import {
  ProfileWorkspaceAccess,
  ProfileWorkspaceStatus,
  domainAssociationNames,
  models,
  profileAssociationNames,
  workspaceProfileAssociationNames,
} from "../../database";
import { extractRequestedFieldsFromInfo, getRequestedFields } from "../utils";
import { Includeable } from "sequelize";

// Finish WorkspaceProfile and test the endpoints

export const workspaceTypeDefs = gql`
  type Domain {
    domain: String
  }
  
  type WorkspaceProfile {
    id: String!
    access: ProfileWorkspaceAccess!
    status: ProfileWorkspaceStatus!
    title: String
    profile: Profile;
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
      name: String
      domains: [DomainInput]
      profiles: [ProfileInput]
    ): Workspace!

    deleteWorkspace(id: String!): Workspace
  }
`;

function prepareIncludesFromInfo(info: any) {
  const requestedFields = extractRequestedFieldsFromInfo(info);
  const includeProfiles = requestedFields.includes("profiles");
  const includeDomains = requestedFields.includes("domains");

  const include: Includeable[] = [];

  if (includeProfiles) {
    include.push({
      model: models.profile,
      as: profileAssociationNames.plural,
    });
  }

  if (includeDomains) {
    include.push({
      model: models.domain,
      as: domainAssociationNames.plural,
    });
  }

  return include;
}

export const workspaceQueryResolvers = {
  getWorkspaces(
    _: undefined,
    data: { id: string; email: string },
    contextValue: any,
    info: any
  ) {
    const include = prepareIncludesFromInfo(info);
    return models.workspace.findAll({ where: { ...data }, include });
  },
};

export const workspaceMutationResolvers = {
  createWorkspace(
    _: undefined,
    data: {
      image: string;
      name: string;
      domains: { domain: string }[];
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
    return models.workspace
      .create(workspaceData, { returning: true })
      .then((workspace) => {
        return Promise.all([
          models.domain.bulkCreate(
            domains.map((d) => ({ ...d, workspace_id: workspace.id }))
          ),
          models.workspaceProfile
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
                ? Promise.all(workspaceProfiles.map((p) => p.getProfile()))
                : []
            ),
        ]).then(([domains, profiles]) => {
          workspace.domains = domains;
          workspace.profiles = profiles;
          return workspace;
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
    const newDomains = domains ? domains.filter((domain) => !domain.id) : null;
    const existingDomains = domains
      ? domains.filter((domain) => !!domain.id)
      : null;
    return Promise.all([
      newDomains
        ? Promise.all(
            newDomains.map(({ domain }) =>
              models.domain.create({ domain, workspace_id: data.id })
            )
          )
        : null,
      existingDomains
        ? models.domain.findAll({
            where: { id: { $in: existingDomains.map((d) => d.id!) } },
          })
        : null,
      models.workspace.findByPk(data.id, {
        include: data.profiles
          ? [
              {
                model: models.workspaceProfile,
                as: workspaceProfileAssociationNames.plural,
              },
            ]
          : [],
      }),
    ]).then(([newDomains, existingDomains, workspace]) => {
      if (!workspace) {
        return null;
      }
      const allWorkspaceDomains =
        existingDomains && newDomains
          ? [...existingDomains, ...newDomains]
          : null;
      const updateExistingWorkspaceProfilesPromise =
        workspace.workspaceProfiles!.map((wp) => {
          const currentWorkspaceProfileUpdate = profiles.find(
            (p) => p.id === wp.id
          );
          if (!currentWorkspaceProfileUpdate) {
            return wp.destroy();
          }
          Object.entries(currentWorkspaceProfileUpdate).forEach(
            ([key, value]) => {
              wp.set(key as any, value);
            }
          );

          return wp.changed() ? wp.save() : Promise.resolve(wp);
        });
    });
    // return models.workspace
    //   .create(workspaceData, { returning: true })
    //   .then((workspace) => {
    //     return Promise.all([
    //       models.domain.bulkCreate(
    //         domains.map((d) => ({ ...d, workspace_id: workspace.id }))
    //       ),
    //       models.workspaceProfile
    //         .bulkCreate(
    //           profiles.map(({ id, access, status, title }) => ({
    //             profile_id: id,
    //             workspace_id: workspace.id,
    //             access,
    //             status,
    //             title,
    //           }))
    //         )
    //         .then((workspaceProfiles) =>
    //           requestedFields.profiles
    //             ? Promise.all(workspaceProfiles.map((p) => p.getProfile()))
    //             : []
    //         ),
    //     ]).then(([domains, profiles]) => {
    //       workspace.domains = domains;
    //       workspace.profiles = profiles;
    //       return workspace;
    //     });
    //   });
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
        .then(() => workspace);
    });
  },
};
