import {
  ProfileWorkspaceAccess,
  domainAssociationNames,
  models,
  workspaceProfileAssociationNames,
} from "../../database";
import { AuthorizationError } from "../../errors";
import { AuthenticatedAppContext } from "../types";
import config from "../../config";
import { getDomainFromUrl } from "../utils";
import { authenticate } from "./authenticate";
import { getEmailDomain } from "../resources/utils";

type AuthorizeProps =
  | {
      masterOnly?: false | null | undefined;
      allowedWorkspaceAccess: ProfileWorkspaceAccess[];
    }
  | {
      masterOnly: true;
      allowedWorkspaceAccess?: null | undefined;
    };

export const authorize =
  (props: AuthorizeProps) =>
  <TArgs extends object, TResult>(
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
        const emailDomain = getEmailDomain(context.decodedProfileData.email)!;
        const isMasterDomain = config.app.masterDomains.includes(emailDomain);

        if (isMasterDomain) {
          context.isMaster = true;
          return next(parent, args, context, info);
        }
        if (props.masterOnly)
          throw new Error(AuthorizationError.NOT_AUTHORIZED);

        if ("workspace_id" in args) {
          args.workspace_id = context.decodedProfileData.workspace.workspace_id;
        }

        return models.workspace
          .findOne({
            include: [
              {
                model: models.domain,
                as: domainAssociationNames.plural,
                where: { domain: emailDomain },
              },
              {
                model: models.workspaceProfile,
                as: workspaceProfileAssociationNames.plural,
                where: { profile_id: context.decodedProfileData.id },
              },
            ],
          })
          .then((originWorkspace) => {
            if (!originWorkspace)
              throw new Error(AuthorizationError.NOT_AUTHORIZED);

            const currentWorkspaceProfile =
              originWorkspace.workspaceProfiles?.[0] || null;

            if (
              !currentWorkspaceProfile ||
              !props.allowedWorkspaceAccess!.includes(
                currentWorkspaceProfile.access
              )
            )
              throw new Error(AuthorizationError.NOT_AUTHORIZED);

            return next(parent, args, context, info);
          });
      }
    );
