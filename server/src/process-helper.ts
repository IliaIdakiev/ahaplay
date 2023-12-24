import { exec } from "child_process";
import express from "express";
import bodyParser from "body-parser";
import pm2 from "pm2";
import config from "./config";
import { connectRedis, redisClient, pubSub } from "./redis";
import { minutesToMilliseconds } from "date-fns";

const app = express();

const processManager = {
  startOrReturnExistingOneProcess({
    scriptLocation,
    processName,
    args,
    nodeArgs,
  }: {
    scriptLocation: string;
    processName: string;
    args?: string | string[];
    nodeArgs?: string | string[];
  }) {
    let force: () => void;
    const forceResolver = new Promise<any>((res) => (force = () => res(null)));

    const processReadySubscription = Promise.race([
      new Promise<number | null>((res, rej) => {
        let subscriptionId: number;
        pubSub
          .subscribe(`processing_process_ready:${processName}`, (pid) => {
            pubSub.unsubscribe(subscriptionId);
            res(pid);
          })
          .then((id) => {
            subscriptionId = id;
            const _force = force;
            force = () => {
              try {
                pubSub.unsubscribe(subscriptionId);
              } catch (e) {}
              res(null);
              _force();
            };
          })
          .catch((err) => rej(err));
      }),
      new Promise((res) => {
        processManager
          .findProcessByName({ processName })
          .then((existingProcess) => {
            if (existingProcess) return void res(existingProcess);
            const _force = force;
            force = () => {
              res(null);
              _force();
            };
          });
      }),
      forceResolver,
    ]);

    return redisClient
      .setNX(`processing_process_name:${processName}`, "yes")
      .then((wasWritten) => {
        if (wasWritten) {
          return null;
        }
        return processReadySubscription;
      })
      .then((foundProcess) => {
        return foundProcess
          ? foundProcess
          : processManager.findProcessByName({ processName });
      })
      .then((existingProcess) => {
        if (existingProcess) {
          return {
            isNew: false,
            process: existingProcess,
          };
        }
        return new Promise<{ isNew: true; process: pm2.ProcessDescription }>(
          (res, rej) => {
            pm2.start(
              {
                script: scriptLocation,
                name: processName,
                args,
                autorestart: true,
                node_args: nodeArgs,
                kill_timeout: minutesToMilliseconds(30),
              },
              (err, process) => {
                if (err) return void rej(err);
                res({ isNew: true, process });
              }
            );
          }
        );
      })
      .then((result) => {
        redisClient.del(`processing_process_name:${processName}`).then(() => {
          pubSub.publish(
            `processing_process_ready:${processName}`,
            process.pid
          );
        });
        force();
        return result;
      });
  },
  findProcessByName({ processName }: { processName: string }) {
    return new Promise<pm2.ProcessDescription | null>((res, rej) => {
      pm2.list((err, processes) => {
        if (err) return void rej(err);
        const existingProcess = processes.find(
          (process) => process.name === processName
        );
        res(existingProcess || null);
      });
    });
  },
  deleteProcess({ processName }: { processName: string }) {
    return this.findProcessByName({ processName }).then((existingProcess) => {
      if (!existingProcess || !existingProcess.pid) return null;
      return new Promise<pm2.ProcessDescription | null>((res, rej) => {
        pm2.delete(processName, (err, process) => {
          if (err) return void rej(err);
          res(process);
        });
      });
    });
  },
};

app.use(bodyParser.json());

app.post("/exec", (req, res) => {
  const { command } = req.body;
  exec(command, (error, stdout) => {
    if (error) return void res.status(500).send(error.message);
    res.status(200).send(stdout);
  });
});

app.post("/pm2/process", (req, res) => {
  processManager
    .startOrReturnExistingOneProcess(req.body)
    .then((result) => {
      const {
        isNew,
        process: { pid },
      } = result;
      res.send({ isNew, id: pid });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send(error);
    });
});

app.get("/pm2/process/:name", (req, res) => {
  const { name } = req.params;
  processManager
    .findProcessByName({ processName: name })
    .then((process) => {
      const { pid = null } = process || {};
      res.send({ id: pid });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send(error);
    });
});

app.delete("/pm2/process/:name", (req, res) => {
  const { name } = req.params;
  processManager
    .deleteProcess({ processName: name })
    .then((process) => {
      const { pid = null } = process || {};
      res.send({ id: pid });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send(error);
    });
});

process.on("exit", () => {
  pm2.disconnect();
});

Promise.all([
  connectRedis(),
  new Promise<void>((res, rej) => {
    pm2.connect((err) => {
      if (err) return void rej(err);
      res();
    });
  }),
]).then(() => {
  console.log(
    "Helper process connected to PM2 and REDIS. Ready to start processes 🚀"
  );
  app.listen(config.app.helperPort, () => {
    console.log(
      `Process helper listening for requests on :${config.app.helperPort}`
    );
  });
});
