import { sequelize } from "./sequelize";
import "./models";

export const connect = () => sequelize.authenticate();
