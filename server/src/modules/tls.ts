import * as fs from "fs";
import config from "../config";
import { environment } from "../env";
import { promisify } from "util";
import { exec } from "child_process";

const unlink = promisify(fs.unlink.bind(fs)) as unknown as (
  path: fs.PathLike
) => Promise<void>;
const stat = promisify(fs.stat.bind(fs)) as unknown as (
  path: fs.PathLike,
  options?:
    | (fs.StatOptions & {
        bigint?: false | undefined;
      })
    | undefined
) => Promise<fs.Stats>;

const certificateLocation = config.app.certificateLocation;
function generateCertificatePath(domain: string, type: "key" | "cert") {
  return `${certificateLocation}/${domain}-${type}.pem`;
}

const generateSelfSignedCertificateCommand = (domain: string) => {
  const certificateFullPath = generateCertificatePath(domain, "cert");
  const certificateKeyFullPath = generateCertificatePath(domain, "key");
  const command = `openssl req -newkey rsa:2048 -nodes -keyout ${certificateKeyFullPath} -x509 -days 365 -out ${certificateFullPath} -subj "/C=BG/L=Sofia/O=Ahaplay/CN=ahaplay.com"`;
  return {
    certificateFullPath,
    certificateKeyFullPath,
    command,
  };
};

export const tls = {
  generateCertificate({ domain }: { domain: string }) {
    if (environment === "prod") {
      throw new Error("Setup certbot functionality here");
    }
    return new Promise<{
      certificateFullPath: string;
      certificateKeyFullPath: string;
    }>((res, rej) => {
      const { command, certificateFullPath, certificateKeyFullPath } =
        generateSelfSignedCertificateCommand(domain);
      exec(command, (error) => {
        if (error) return rej(error);
        res({ certificateFullPath, certificateKeyFullPath });
      });
    });
  },
  deleteCertificate({ domain }: { domain: string }) {
    if (environment === "prod") {
      throw new Error("Setup removal of certbot certificates");
    }
    const certificateFullPath = generateCertificatePath(domain, "cert");
    const certificateKeyFullPath = generateCertificatePath(domain, "key");
    return Promise.all([
      stat(certificateFullPath)
        .then(() => unlink(certificateFullPath))
        .then(() => certificateFullPath)
        .catch((error) => {
          console.error(error);
          return certificateFullPath;
        }),
      stat(certificateKeyFullPath)
        .then(() => unlink(certificateKeyFullPath))
        .then(() => certificateKeyFullPath)
        .catch((error) => {
          console.error(error);
          return certificateKeyFullPath;
        }),
    ] as const);
  },
};
