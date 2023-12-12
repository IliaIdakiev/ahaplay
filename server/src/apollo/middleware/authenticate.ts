import { AuthenticationError } from "../../errors";
import { verifyToken } from "../../modules";
import { AuthJwtPayload } from "../../types";
import { AuthenticatedAppContext, AppContext } from "../types";

// Strictly authenticated middleware check
export const authenticate =
  <TArgs, TResult>(
    next: (
      parent: any,
      args: TArgs,
      context: AuthenticatedAppContext,
      info: any
    ) => TResult
  ) =>
  (
    parent: any,
    args: TArgs,
    context: AppContext,
    info: any
  ): Promise<TResult> => {
    if (!context.token) throw new Error(AuthenticationError.TOKEN_NOT_FOUND);
    return verifyToken<AuthJwtPayload>(context.token)
      .then((decodedData) => {
        context.decodedProfileData = decodedData;
        return next(parent, args, context as AuthenticatedAppContext, info);
      })
      .catch((err) => {
        if (err.message === "jwt expired")
          throw new Error(AuthenticationError.TOKEN_EXPIRED);
        throw err;
      });
  };
