'use strict';
const path = require("path");
const { readFileInLines } = require("../seeders-utils.js");

const csvFilePath = path.resolve(__dirname, "..", "db_exports", "prod", "recommendations_workshops");
const databaseTableName = "recommendations-workshops";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const lines = await readFileInLines(csvFilePath);
    const data = lines.map(line => {
      const lineItems = line.split(/(?<!\\),/g).map(v => v === "\\N" ? null : v);
      return {
        id: lineItems[0],
        create_date: lineItems[1],
        update_date: lineItems[2] || lineItems[1],
        recommendation_id: lineItems[3],
        workshop_id: lineItems[4],
        weight: lineItems[5]
      }
    });
    await queryInterface.bulkInsert(databaseTableName, data);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(databaseTableName, null, {});
  }
};
