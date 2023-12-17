const { exec } = require("child_process");
const express = require("express");
const bodyParser = require("body-parser");
const { minutesToMilliseconds } = require("date-fns");
const pm2 = require("pm2");
const { promisify } = require("util");

const port = 4444;
const app = express();

const pm2Connect = promisify(
  pm2.connect.bind(pm2)
);
const pm2Start = promisify(pm2.start.bind(pm2));
const pm2Stop = promisify(pm2.stop.bind(pm2));
const pm2Delete = promisify(pm2.delete.bind(pm2));
const pm2Disconnect = promisify(pm2.disconnect.bind(pm2));
const pm2List = promisify(pm2.list.bind(pm2));

const processManager = {
  startOrReturnExistingOneProcess({
    scriptLocation,
    processName,
    args,
    nodeArgs,
  }) {
    return pm2Connect()
      .then(() =>
        this._startOrReturnExistingOneProcess(
          scriptLocation,
          processName,
          args,
          nodeArgs
        )
      )
      .then((returnValue) => pm2Disconnect().then(() => returnValue));
  },
  findProcessByName({ processName }) {
    return pm2Connect()
      .then(() => this._findProcessByName(processName))
      .then((returnValue) => pm2Disconnect().then(() => returnValue));
  },
  stopProcess({ processName }) {
    return pm2Connect()
      .then(() => this._stopProcess(processName))
      .then((returnValue) => pm2Disconnect().then(() => returnValue));
  },
  deleteProcess({ processName }) {
    return pm2Connect()
      .then(() => this._deleteProcess(processName))
      .then((returnValue) => pm2Disconnect().then(() => returnValue));
  },

  _startOrReturnExistingOneProcess(
    scriptLocation,
    processName,
    args,
    nodeArgs,
  ) {
    return this._findProcessByName(processName).then((existingProcess) => {
      if (existingProcess) return { isNew: false, process: existingProcess };
      return pm2Start({
        script: scriptLocation,
        name: processName,
        args,
        autorestart: true,
        node_args: nodeArgs,
        kill_timeout: minutesToMilliseconds(30),
      }).then(([process]) => ({ isNew: true, process }));
    });
  },

  _findProcessByName(processName) {
    return pm2List().then((processes) => {
      const existingProcess = processes.find(
        (process) => process.name === processName
      );
      if (existingProcess) return existingProcess;
      return null;
    });
  },

  _stopProcess(processName) {
    return this._findProcessByName(processName).then((existingProcess) => {
      if (!existingProcess || !existingProcess.pm_id) return null;
      return pm2Stop(existingProcess.pm_id).then(() => existingProcess);
    });
  },
  _deleteProcess(processName) {
    return this._findProcessByName(processName).then((existingProcess) => {
      if (!existingProcess || !existingProcess.pm_id) return null;
      return pm2Delete(existingProcess.pm_id).then(() => existingProcess);
    });
  },
};


app.use(bodyParser.json());

app.post("/exec", (req, res) => {
  const { command } = req.body;
  console.log("Executing :", command);
  exec(command, (error, stdout) => {
    if (error) return void res.status(500).send(error.message);
    res.status(200).send(stdout);
  })
});

app.post("/pm2/process", (req, res) => {
  console.log('pm2 post process', req.body);
  processManager.startOrReturnExistingOneProcess(req.body).then((result) => {
    const { isNew, process: { pm_id } } = result;
    res.send({ isNew, id: pm_id });
  }).catch(error => {
    console.error(error);
    res.status(500).send(error);
  });
});

app.get("/pm2/process/:name", (req, res) => {
  console.log('pm2 get process', req.body);
  const { name } = req.params;
  processManager.findProcessByName({ processName: name }).then((process) => {
    const { pm_id = null } = process || {};
    res.send({ id: pm_id });
  }).catch(error => {
    console.error(error);
    res.status(500).send(error);
  });
});

app.delete("/pm2/process/:name", (req, res) => {
  console.log('pm2 delete process', req.body);
  const { name } = req.params;
  processManager.deleteProcess({ processName: name }).then((process) => {
    const { pm_id = null } = process || {};
    res.send({ id: pm_id });
  }).catch(error => {
    console.error(error);
    res.status(500).send(error);
  });
});

app.listen(port, (err) => {
  if (err) return void console.error(err);
  console.log("Process helper listening on port " + port);
});
