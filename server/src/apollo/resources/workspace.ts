import gql from "graphql-tag";
import { models, workspaceAssociationNames } from "../../database";
import { extractRequestedFieldsFromInfo } from "../utils";
import { Includeable } from "sequelize";

export const workspaceTypeDefs = gql`
  type Workspace {
    image: String
    workspace_key: String
    name: String!
    domain: String!
    profiles: [Profile]
  }
`;

export const workspaceQueryDefs = gql`
  extend type Query {
    getWorkspaces(name: String, domain: String): [Workspace]
  }
`;

function prepareIncludesFromInfo(info: any) {
  const requestedFields = extractRequestedFieldsFromInfo(info);
  const includeProfiles = requestedFields.includes("profiles");

  const include: Includeable[] = [];

  if (includeProfiles) {
    include.push({
      model: models.profile,
      as: workspaceAssociationNames.plural,
    });
  }

  return include;
}

export const workspaceQueryResolvers = {
  getWorkspaces(
    _: undefined,
    data: { id: string; email: string; active_workspace_id: string },
    contextValue: any,
    info: any
  ) {
    const include = prepareIncludesFromInfo(info);
    return models.workspace.findAll({ where: { ...data }, include });
  },
};
