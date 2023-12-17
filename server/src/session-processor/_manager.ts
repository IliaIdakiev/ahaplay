import { minutesToMilliseconds } from "date-fns";
import pm2 from "pm2";
import { promisify } from "util";

const pm2Connect = promisify(
  pm2.connect.bind(pm2)
) as unknown as () => Promise<void>;
const pm2Start = promisify(pm2.start.bind(pm2)) as unknown as (
  config: pm2.StartOptions
) => Promise<pm2.ProcessDescription[]>;
const pm2Stop = promisify(pm2.stop.bind(pm2)) as unknown as (
  processIdOrName: string | number
) => Promise<void>;
const pm2Disconnect = promisify(
  pm2.disconnect.bind(pm2)
) as unknown as () => Promise<void>;
const pm2List = promisify(pm2.list.bind(pm2)) as unknown as () => Promise<
  pm2.ProcessDescription[]
>;

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
  findProcessByName({ processName }: { processName: string }) {
    return pm2Connect()
      .then(() => this._findProcessByName(processName))
      .then((returnValue) => pm2Disconnect().then(() => returnValue));
  },
  stopProcess({ processName }: { processName: string }) {
    return pm2Connect()
      .then(() => this._stopProcess(processName))
      .then((returnValue) => pm2Disconnect().then(() => returnValue));
  },

  _startOrReturnExistingOneProcess(
    scriptLocation: string,
    processName: string,
    args?: string | string[],
    nodeArgs?: string | string[]
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

  _findProcessByName(processName: string) {
    return pm2List().then((processes) => {
      const existingProcess = processes.find(
        (process) => process.name === processName
      );
      if (existingProcess) return existingProcess;
      return null;
    });
  },

  _stopProcess(processName: string) {
    return this._findProcessByName(processName).then((existingProcess) => {
      if (!existingProcess || !existingProcess.pm_id) return null;
      return pm2Stop(existingProcess.pm_id);
    });
  },
};
