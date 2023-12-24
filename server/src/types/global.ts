import { AuthenticatedUserData } from "./authenticated-user-data";

declare global {
  const __basedir: string;

  namespace Express {
    interface Request {
      authenticatedUserData: AuthenticatedUserData | undefined;
    }
  }
}

export default global;
