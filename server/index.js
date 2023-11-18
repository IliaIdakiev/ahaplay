const fs = require('fs');
const path = require('path');
const sourceDirectoryName = 'dist';
const sourceDirectoryPath = path.resolve(sourceDirectoryName);
const sessionProcessorDirectory = path.join(sourceDirectoryPath, 'session-processor');
const sessionProcessorMainFileLocation = path.join(sessionProcessorDirectory, 'main.js');
const sessionProcessorTestDispatcherFile = path.join(sessionProcessorDirectory, 'test-dispatcher.js');

const exists = fs.existsSync(path.join(sourceDirectoryPath, 'index.js'));

if (!exists) {
  const message = `No bootstrap file found! Make sure you have successfully compiled the project and ${path.resolve(__dirname, 'dist', 'index.js')} exist!`;
  throw new Error(message);
}

console.log(`%cSetting base dir to ${__dirname}`, "color: red");
global.__basedir = __dirname;


const args = process.argv.slice(2);
const startSessionProcessor = args[1] === '--session-processor';
const startTestDispatcher = args[1] === '--test-dispatcher';
const sessionId = args[0];

if (startSessionProcessor && sessionId) {
  console.log('%cStarting xstate session processor', "color: red");
  return require(sessionProcessorMainFileLocation);
} else if (startTestDispatcher && sessionId) {
  console.log('%cStarting test dispatcher for xstate session processor', "color: red");
  return require(sessionProcessorTestDispatcherFile);
}

console.log('%cStarting ahaplay server', "color: red");
require(sourceDirectoryName);