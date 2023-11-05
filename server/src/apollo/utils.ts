import { DocumentNode } from "graphql";
import { AppContext } from "./types/context";
import { pubSub } from "./pub-sub";
import { readAuthToken, verifyToken } from "../modules";
import { AuthError } from "./types";
import { AuthenticatedUserData } from "../types";
import config from "../config";

export function extractType(typeName: string, gqlDef: DocumentNode) {
  const result = getGqlDefBody(gqlDef).replace(
    new RegExp(`.*?type ${typeName}.{([^}]*)}.*`),
    "$1"
  );
  return result;
}

export function extractQuery(gqlDef: DocumentNode) {
  return extractType("Query", gqlDef);
}

export function extractSubscription(gqlDef: DocumentNode) {
  return extractType("Subscription", gqlDef);
}

export function getGqlDefBody(gqlDef: DocumentNode) {
  return gqlDef.loc!.source.body;
}

export function extractRequestedFieldsFromInfo(info: any) {
  return info.fieldNodes[0].selectionSet.selections.map(
    (field: any) => field.name.value
  );
}

export function generateRequestContext(req: any) {
  const { connectionParams = null, headers = null } = req;
  const token = readAuthToken({ headers: headers || connectionParams });
  if (!token) {
    return Promise.reject(AuthError.INVALID_CREDENTIALS);
  }

  return verifyToken<AuthenticatedUserData>(token)
    .then((userData) => {
      const context: AppContext = {
        authenticatedProfile: {
          profileId: userData.id,
          workspaceId: userData.active_workspace_id,
        },
        pubSub,
      };
      return context;
    })
    .catch(() => Promise.reject(AuthError.INVALID_CREDENTIALS));
}
