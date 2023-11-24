import { sequelize } from "./sequelize-instance";
import { sync } from "./sync";
import config from "../config";
import "./models";

export const connectSequelize = () =>
  sequelize
    .authenticate()
    .then(() => {
      if (!config.app.syncSequelizeModels) return;
      return sync();
    })
    .catch((error) => {
      console.error("Sequelize connection failed", error);
      return Promise.reject(error);
    });
