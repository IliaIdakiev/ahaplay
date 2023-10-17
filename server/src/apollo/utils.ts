import { DocumentNode } from "graphql";

export function extractQueries(gqlDef: DocumentNode) {
  return gqlDef.loc!.source.body.replace(/.*?type Query.{([^}]*)}.*/, "$1");
}

export function extractRequestedFieldsFromInfo(info: any) {
  return info.fieldNodes[0].selectionSet.selections.map(
    (field: any) => field.name.value
  );
}
