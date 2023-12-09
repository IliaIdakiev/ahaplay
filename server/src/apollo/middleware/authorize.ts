import {
  ProfileWorkspaceAccess,
  domainAssociationNames,
  models,
  workspaceProfileAssociationNames,
} from "../../database";
import { AuthenticationError, AuthorizationError } from "../../errors";
import { verifyToken } from "../../modules";
import { AuthJwtPayload } from "../../types";
import { AppContext, AuthenticatedAppContext } from "../types";
import config from "../../config";
import { Includeable } from "sequelize";
import { getDomainFromUrl } from "../utils";

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
        context.decodedProfileData = {
          email: decodedData.email,
          profileId: decodedData.id,
        };
        return next(parent, args, context as AuthenticatedAppContext, info);
      })
      .catch((err) => {
        if (err.message === "jwt expired")
          throw new Error(AuthenticationError.TOKEN_EXPIRED);
        throw err;
      });
  };

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
    if (context.token === null)
      Promise.resolve(next(parent, args, context, info));
    return verifyToken(context.token!)
      .then(() => {
        throw new Error(AuthenticationError.ALREADY_AUTHENTICATED);
      })
      .catch((err) => {
        if (err.message !== "jwt expired") throw err;
        return next(parent, args, context, info);
      });
  };

export const authorize =
  (props: { allowedWorkspaceAccess: ProfileWorkspaceAccess[] }) =>
  <TArgs, TResult>(
    next: (
      parent: any,
      args: TArgs,
      context: AuthenticatedAppContext,
      info: any
    ) => Promise<TResult>
  ) =>
    authenticate(
      (
        parent: any,
        args: TArgs,
        context: AuthenticatedAppContext,
        info: any
      ): Promise<TResult> => {
        const origin = getDomainFromUrl(context.origin);
        const match = context.decodedProfileData.email.match(/@([^@]+)$/) || [];
        const emailDomain = match[1];
        const isMasterDomain = config.app.masterDomains.includes(emailDomain);

        const workspaceInclude: Includeable[] = [
          {
            model: models.domain,
            as: domainAssociationNames.plural,
            where: { domain: origin },
          },
        ];

        if (!isMasterDomain) {
          workspaceInclude.push({
            model: models.workspaceProfile,
            as: workspaceProfileAssociationNames.plural,
            where: { profile_id: context.decodedProfileData.profileId },
          });
        }

        return models.workspace
          .findOne({
            include: workspaceInclude,
          })
          .then((originWorkspace) => {
            if (!originWorkspace)
              throw new Error(AuthorizationError.NOT_AUTHORIZED);
            const currentWorkspaceProfile =
              originWorkspace.workspaceProfiles?.[0] || null;
            if (
              !isMasterDomain &&
              (!currentWorkspaceProfile ||
                !props.allowedWorkspaceAccess.includes(
                  currentWorkspaceProfile.access
                ))
            )
              throw new Error(AuthorizationError.NOT_AUTHORIZED);
            context.originWorkspace = originWorkspace;
            return next(parent, args, context, info);
          });
      }
    );
