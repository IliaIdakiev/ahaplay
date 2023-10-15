import { hash, genSalt } from "bcrypt";
import config from "../../config";

const hashSaltRounds = config.app.hashSaltRounds;

export function hashPassword(
  password: string
): Promise<{ salt: string; hash: string } | null> {
  if (!password) {
    return Promise.resolve(null);
  }
  return genSalt(hashSaltRounds).then((salt) =>
    hash(password, salt).then((hash) => ({ hash, salt }))
  );
}
