'use strict';
const path = require("path");
const { readFileInLines } = require("../seeders-utils.js");

const csvFilePath = path.resolve(__dirname, "..", "db_exports", "concepts");
const databaseTableName = "concepts";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const lines = await readFileInLines(csvFilePath);
    const data = lines.map(line => {
      const lineItems = line.split(/(?<!\\),/g).map(v => v === "\\N" ? null : v);
      return {
        id: lineItems[0],
        create_date: lineItems[1],
        name: lineItems[2],
        sequence_number: lineItems[3],
        text: lineItems[4],
        update_date: lineItems[5] || lineItems[1],
        activity_id: lineItems[6]
      }
    });
    await queryInterface.bulkInsert(databaseTableName, data);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(databaseTableName, null, {});
  }
};
