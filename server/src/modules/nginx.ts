import * as path from "path";
import * as fs from "fs";
import config from "../config";
import { promisify } from "util";
import EventEmitter from "events";
import { exec } from "child_process";
import { tls } from "./tls";

const readFile = promisify(fs.readFile.bind(fs)) as unknown as (
  path: fs.PathOrFileDescriptor,
  options: {
    encoding?: string | null | undefined;
    flag?: string | undefined;
  } & EventEmitter.Abortable
) => Promise<any>;
const writeFile = promisify(fs.writeFile.bind(fs)) as unknown as (
  file: fs.PathOrFileDescriptor,
  data: string | NodeJS.ArrayBufferView,
  options?: fs.WriteFileOptions
) => Promise<any>;
const stat = promisify(fs.stat.bind(fs)) as unknown as (
  path: fs.PathLike,
  options?:
    | (fs.StatOptions & {
        bigint?: false | undefined;
      })
    | undefined
) => Promise<fs.Stats>;
const unlink = promisify(fs.unlink.bind(fs)) as unknown as (
  path: fs.PathLike
) => Promise<void>;
const execAsync = promisify(exec) as unknown as (
  command: string
) => Promise<string>;

const nginxDomainTemplateConfigurationFilePath = path.join(
  __basedir,
  config.nginx.domainConfigurationTemplateLocation
);

export const nginx = {
  reloadConfiguration() {
    const command = `nginx -s reload`;
    return new Promise<void>((res, rej) => {
      exec(command, (error) => {
        if (error) return rej(error);
        res();
      });
    });
  },
  createConfigurationFiePath(domain: string) {
    return path.join(
      config.nginx.location,
      config.nginx.configurationsFolderName,
      `${domain}.nginx.conf`
    );
  },
  createDomainConfiguration(domain: string) {
    return tls
      .generateCertificate({ domain })
      .then(({ certificateFullPath, certificateKeyFullPath }) => {
        return Promise.all([
          readFile(nginxDomainTemplateConfigurationFilePath, {
            encoding: "utf-8",
          }) as Promise<string>,
          certificateFullPath,
          certificateKeyFullPath,
        ] as const);
      })
      .then(
        ([templateAsString, certificateFullPath, certificateKeyFullPath]) => {
          const domainConfiguration = templateAsString
            .replace(/<domain>/g, domain)
            .replace(/<certificate_location>/g, certificateFullPath)
            .replace(/<certificate_key_location>/g, certificateKeyFullPath);

          const newConfigPathLocation = this.createConfigurationFiePath(domain);
          return writeFile(newConfigPathLocation, domainConfiguration).then(
            () => ({ domain, certificateFullPath, certificateKeyFullPath })
          );
        }
      )
      .then((data) => this.reloadConfiguration().then(() => data));
  },
  removeDomainConfiguration(domain: string) {
    const configPathLocation = this.createConfigurationFiePath(domain);
    return stat(configPathLocation)
      .then(() => unlink(configPathLocation))
      .then((err) => {
        if ((err as any)?.code !== "ENOENT") {
          return configPathLocation;
        }
        return Promise.reject(err);
      })
      .then(() => tls.deleteCertificate({ domain }))
      .then(() => this.reloadConfiguration().then(() => configPathLocation));
  },
  testAndReloadServer() {
    return execAsync(path.join(__basedir, config.nginx.testAndReloadScriptName))
      .then((result) => {
        if (result === "0") {
          return true;
        }
        return false;
      })
      .catch((err) => {
        console.error(err);
        return false;
      });
  },
};
