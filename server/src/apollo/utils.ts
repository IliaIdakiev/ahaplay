import { DocumentNode } from "graphql";

export function extractQueries(gqlDef: DocumentNode) {
  return gqlDef.loc!.source.body.replace(/.*?type Query.{([^}]*)}.*/, "$1");
}
