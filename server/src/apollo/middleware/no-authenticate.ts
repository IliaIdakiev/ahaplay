import { AuthenticationError } from "../../errors";
import { verifyToken } from "../../modules";
import { AppContext } from "../types";

// Strictly not authenticated middleware check
export const noAuthenticate =
  <TArgs, TResult>(
    next: (parent: any, args: TArgs, context: AppContext, info: any) => TResult
  ) =>
  (
    parent: any,
    args: TArgs,
    context: AppContext,
    info: any
  ): Promise<TResult> => {
    context.decodedProfileData = null;
    if (!context.token)
      return Promise.resolve(next(parent, args, context, info));
    return verifyToken(context.token!)
      .then(() => {
        throw new Error(AuthenticationError.ALREADY_AUTHENTICATED);
      })
      .catch((err) => {
        if (err.message !== "jwt expired") throw err;
        return next(parent, args, context, info);
      });
  };
