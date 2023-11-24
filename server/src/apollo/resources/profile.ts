import gql from "graphql-tag";
import { models, workspaceAssociationNames } from "../../database";
import { extractRequestedFieldsFromInfo } from "../utils";
import { Includeable } from "sequelize";

export const profileTypeDefs = gql`
  type Profile {
    email: String
    headline: String
    image: String
    login_date: Date
    name: String
    password: String
    is_completed: Boolean
    workspace: Workspace
  }
`;

export const profileQueryDefs = gql`
  extend type Query {
    getProfiles(id: String, email: String): [Profile]
  }
`;

function prepareIncludesFromInfo(info: any) {
  const requestedFields = extractRequestedFieldsFromInfo(info);
  const includeWorkspace = requestedFields.includes("workspace");

  const include: Includeable[] = [];

  if (includeWorkspace) {
    include.push({
      model: models.workspace,
      as: workspaceAssociationNames.singular,
    });
  }

  return include;
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
