import * as path from "path";
import {
  IAppConfig,
  IConfig,
  IDatabaseConfig,
  IRedisConfig,
  IWorkshopConfig,
} from "./types";
import { environment } from "./env";

const configPath = path.resolve(__basedir, "config");

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

const redisConfig = require(path.join(
  configPath,
  `redis.config.${environment}`
)) as IRedisConfig;

const config: IConfig = {
  app: appConfig,
  db: dbConfig,
  workshop: workshopConfig,
  redis: redisConfig,
};

export default config;
