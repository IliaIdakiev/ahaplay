const fs = require('fs');
const path = require('path');
const exists = fs.existsSync('./dist/index.js');
if (!exists) {
  const message = `No bootstrap file found! Make sure you have successfully compiled the project and ${path.resolve(__dirname, 'dist', 'index.js')} exist!`;
  throw new Error(message);
}

console.log(`Setting base dir to ${__dirname}`);
global.__basedir = __dirname;

require('./dist');