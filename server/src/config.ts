import * as path from "path";
import { IAppConfig, IConfig, IDatabaseConfig } from "./types";

const configPath = path.resolve(__basedir, "config");
const supportedEnvironments = ["dev", "prod", "test"];

const environment =
  (process.env.NODE_ENV?.toLocaleLowerCase() as "dev" | "prod" | "test") ||
  "dev";
if (!supportedEnvironments.includes(environment)) {
  throw new Error(`Supported environments are: ${supportedEnvironments}`);
}

const appConfig = require(path.join(
  configPath,
  `app.config.${environment}`
)) as IAppConfig;

const dbConfig = require(path.join(
  configPath,
  `db.config.${environment}`
)) as IDatabaseConfig;

const config: IConfig = {
  app: appConfig,
  db: dbConfig,
};

export default config;
