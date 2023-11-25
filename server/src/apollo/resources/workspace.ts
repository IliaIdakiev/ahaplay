import gql from "graphql-tag";
import {
  domainAssociationNames,
  models,
  workspaceAssociationNames,
} from "../../database";
import { extractRequestedFieldsFromInfo } from "../utils";
import { Includeable } from "sequelize";

export const workspaceTypeDefs = gql`
  type Domain {
    domain: String
  }
  type Workspace {
    id: String!
    image: String
    workspace_key: String
    name: String!
    domains: [Domain]!
    profiles: [Profile]
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
  type Mutation {
    createWorkspace(
      image: String
      name: String
      domains: [DomainInput]
    ): Workspace!
  }
`;

function prepareIncludesFromInfo(info: any) {
  const requestedFields = extractRequestedFieldsFromInfo(info);
  // const includeProfiles = requestedFields.includes("profiles");

  const include: Includeable[] = [];

  // if (includeProfiles) {
  //   include.push({
  //     model: models.profile,
  //     as: workspaceAssociationNames.plural,
  //   });
  // }

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
    include.push({
      model: models.domain,
      as: domainAssociationNames.plural,
    });
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
    },
    contextValue: any,
    info: any
  ) {
    const { domains, ...workspaceData } = data;
    return models.workspace
      .create(workspaceData, { returning: true })
      .then((workspace) => {
        return models.domain
          .bulkCreate(
            domains.map((d) => ({ ...d, workspace_id: workspace.id }))
          )
          .then((domains) => {
            workspace.domains = domains;
            return workspace;
          });
      });
  },
};
