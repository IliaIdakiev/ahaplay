import { sequelize } from "./sequelize-instance";
import "./models";

export const connectSequelize = () =>
  sequelize.authenticate().catch((error) => {
    console.error("Sequelize connection failed", error);
    return Promise.reject(error);
  });
