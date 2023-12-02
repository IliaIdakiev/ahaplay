import { DocumentNode } from "graphql";
import { AppContext } from "./types/context";
import { pubSub } from "../redis";
import { readAuthToken, verifyToken } from "../modules";
import { AuthError } from "./types";
import { AuthenticatedUserData } from "../types";

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

export function extractMutation(gqlDef: DocumentNode) {
  return extractType("Mutation", gqlDef);
}

export function getGqlDefBody(gqlDef: DocumentNode) {
  return gqlDef.loc!.source.body;
}

export function getRequestedFields(
  info: any,
  selectionSet = info.fieldNodes[0].selectionSet
) {
  const fields: any = {};

  selectionSet.selections.forEach((selection: any) => {
    const key = selection.name.value;

    if (selection.selectionSet) {
      fields[key] = getRequestedFields(info, selection.selectionSet);
    } else {
      fields[key] = true;
    }
  });

  return fields;
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
        },
        pubSub,
      };
      return context;
    })
    .catch(() => Promise.reject(AuthError.INVALID_CREDENTIALS));
}
