const fs = require('fs');
const path = require('path');
const exists = fs.existsSync('./dist/index.js');
if (!exists) {
  const message = `No bootstrap file found! Make sure you have successfully compiled the project and ${path.resolve(__dirname, 'dist', 'index.js')} exist!`;
  throw new Error(message);
}

console.log(`Setting base dir to ${__dirname}`);
global.__basedir = __dirname;


const args = process.argv.slice(2);
const startSessionProcessor = args[1] === '--session-processor';
const startTestDispatcher = args[1] === '--test-dispatcher';
const sessionId = args[0];

if (startSessionProcessor && sessionId) {
  return require('./dist/session-processor/main-xstate');
} else if (startTestDispatcher && sessionId) {
  return require('./dist/session-processor/test-dispatcher');
}

require('./dist');