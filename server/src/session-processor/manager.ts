import axios from "axios";

const helperPort = 4444;
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
    return axios
      .post(`http://127.0.0.1:${helperPort}/pm2/process`, {
        scriptLocation,
        processName,
        args,
        nodeArgs,
      })
      .then((res) => res.data);
  },
  findProcessByName({ processName }: { processName: string }) {
    return axios
      .get(`http://127.0.0.1:${helperPort}/pm2/process/${processName}`)
      .then((res) => res.data);
  },
  deleteProcess({ processName }: { processName: string }) {
    return axios
      .delete(`http://127.0.0.1:${helperPort}/pm2/process/${processName}`)
      .then((res) => res.data);
  },
};
