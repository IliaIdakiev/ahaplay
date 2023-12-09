import { sequelize } from "./sequelize-instance";
import { sync } from "./sync";
import config from "../config";
import { models } from "./models";

export const connectSequelize = () =>
  sequelize
    .authenticate()
    .then(() => {
      if (!config.app.syncSequelizeModels) return;
      return sync().then(() => ({
        sequelize,
        models,
      }));
    })
    .catch((error) => {
      console.error("Sequelize connection failed", error);
      return Promise.reject(error);
    });
