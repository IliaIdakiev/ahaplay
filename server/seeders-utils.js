const fs = require('fs');
const readline = require('readline');

module.exports.readFileInLines = function readFileInLines(filePath) {
  return new Promise((res, rej) => {
    const lines = [];

    const readStream = readline.createInterface({
      input: fs.createReadStream(filePath),
      output: process.stdout,
      terminal: false
    });

    readStream.on('line', function (line) {
      lines.push(line);
    });

    readStream.on('close', function () {
      res(lines);
    });
    readStream.on("error", (error) => {
      rej(error);
    })
  });
}
