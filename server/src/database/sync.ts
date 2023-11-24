import { sequelize } from "./sequelize-instance";

export function sync() {
  return sequelize
    .sync({ force: false })
    .then(() => {
      console.log("Database synchronized successfully");
    })
    .catch((error) => {
      console.error("Error synchronizing database:", error);
    });
}
