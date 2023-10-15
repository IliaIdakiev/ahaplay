import { models, profileAssociationNames } from "../../../database";
import { Op } from "sequelize";

export function getWorkspaceWithProfiles({
  domain,
  emails,
}: {
  domain: string;
  emails: string[];
}) {
  return models.workspace.findOne({
    where: { domain },
    include: [
      {
        model: models.profile,
        as: profileAssociationNames.plural,
        where: {
          email: {
            [Op.in]: emails,
          },
        },
      },
    ],
  });
}
