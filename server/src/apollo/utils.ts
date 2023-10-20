import { DocumentNode } from "graphql";

export function extractType(typeName: string, gqlDef: DocumentNode) {
  const result = getGqlDefBody(gqlDef).replace(
    new RegExp(`.*?type ${typeName}.{([^}]*)}.*`),
    "$1"
  );
  return result;
}

export function extractQueries(gqlDef: DocumentNode) {
  return extractType("Query", gqlDef);
}

export function getGqlDefBody(gqlDef: DocumentNode) {
  return gqlDef.loc!.source.body;
}

export function extractRequestedFieldsFromInfo(info: any) {
  return info.fieldNodes[0].selectionSet.selections.map(
    (field: any) => field.name.value
  );
}
