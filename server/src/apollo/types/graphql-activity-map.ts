import { ActivityEntry } from "../resources/in-memory-metadata/+state/types";

export type GraphQLActivityMap = { key: string; value: ActivityEntry[] }[];
