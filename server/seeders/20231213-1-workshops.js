'use strict';
const path = require("path");
const { readFileInLines } = require("../seeders-utils.js");

const csvFilePath = path.resolve(__dirname, "..", "db_exports", "workshops");
const databaseTableName = "workshops";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const lines = await readFileInLines(csvFilePath);
    const data = lines.map(line => {
      const lineItems = line.split(/(?<!\\),/g).map(v => v === "\\N" ? null : v);
      return {
        id: lineItems[0],
        create_date: lineItems[1],
        duration: lineItems[2],
        topic: lineItems[3],
        type: lineItems[4],
        update_date: lineItems[5] || lineItems[1],
        author_id: lineItems[6],
        headline: lineItems[7],
        status: lineItems[8],
        about_text: lineItems[9],
        about_video: lineItems[10]
      }
    });
    await queryInterface.bulkInsert(databaseTableName, data);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(databaseTableName, null, {});
  }
};
