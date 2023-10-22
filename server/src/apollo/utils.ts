import { DocumentNode } from "graphql";
import { AppContext } from "./typings/context";
import { pubSub } from "./pub-sub";

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
  // TODO: Replace this with proper values when auth is ready
  const context: AppContext = {
    authenticatedUser: {
      profileId: "3cca6408-ecdb-43d5-865b-77c4798b5c36",
      workspaceId: "30b8e6ce-cf20-4d7c-8836-31e244745ffd",
    },
    pubSub,
  };
  return Promise.resolve(context);
}
