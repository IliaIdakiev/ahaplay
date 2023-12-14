import axios from "axios";
const helperPort = 4444;
export function exec(command: string) {
  return axios.post(`http://127.0.0.1:${helperPort}/exec`, { command });
}
