import { Sequelize } from "sequelize";
import config from "../config";

const databaseName = config.db.database;
const databaseUser = config.db.username;
const databaseUserPassword = config.db.password;
const databaseHost = config.db.host;
const databaseDialect = config.db.dialect;

export const sequelize = new Sequelize(
  databaseName,
  databaseUser,
  databaseUserPassword,
  {
    host: databaseHost,
    dialect: databaseDialect,
  }
);
