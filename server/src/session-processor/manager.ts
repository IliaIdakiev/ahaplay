import axios from "axios";
import http from "http";
import config from "../config";

const helperPort = config.app.helperPort;

export const instance = axios.create({
  httpsAgent: new http.Agent({
    maxSockets: Infinity,
    timeout: 99999999999,
  }),
});

export const processManager = {
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
    return instance
      .post(`http://127.0.0.1:${helperPort}/pm2/process`, {
        scriptLocation,
        processName,
        args,
        nodeArgs,
      })
      .then((res) => res.data);
  },
  findProcessByName({ processName }: { processName: string }) {
    return instance
      .get(`http://127.0.0.1:${helperPort}/pm2/process/${processName}`)
      .then((res) => res.data);
  },
  deleteProcess({ processName }: { processName: string }) {
    return instance
      .delete(`http://127.0.0.1:${helperPort}/pm2/process/${processName}`)
      .then((res) => res.data);
  },
};
