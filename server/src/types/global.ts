import { AuthenticatedUserData } from "./authenticated-user-data";

declare global {
  const __is_debug: boolean;
  const __basedir: string;

  namespace Express {
    interface Request {
      authenticatedUserData: AuthenticatedUserData | undefined;
    }
  }
}

export default global;
