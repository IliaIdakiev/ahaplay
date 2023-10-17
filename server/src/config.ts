import * as path from "path";
import { IAppConfig, IConfig, IDatabaseConfig, IWorkshopConfig } from "./types";

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

const workshopConfig = require(path.join(
  configPath,
  `workshop.config.${environment}`
)) as IWorkshopConfig;

const config: IConfig = {
  app: appConfig,
  db: dbConfig,
  workshop: workshopConfig,
};

export default config;
