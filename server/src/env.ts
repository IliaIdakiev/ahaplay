const supportedEnvironments = ["dev", "prod", "test"];

export const environment =
  (process.env.NODE_ENV?.toLocaleLowerCase() as "dev" | "prod" | "test") ||
  "dev";
if (!supportedEnvironments.includes(environment)) {
  throw new Error(`Supported environments are: ${supportedEnvironments}`);
}
