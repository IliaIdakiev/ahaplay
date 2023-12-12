import {
  ProfileWorkspaceAccess,
  ProfileWorkspaceStatus,
  domainAssociationNames,
  models,
  workspaceAssociationNames,
  workspaceProfileAssociationNames,
} from "./database";
import { createToken } from "./modules";
import { AuthJwtPayload } from "./types";

const testDatabaseSetup = {
  createWorkspace({ name, domains }: { name: string; domains: string[] }) {
    return models.workspace.create({ name }).then((workspace) =>
      models.domain
        .bulkCreate(
          domains.map((domain) => ({ domain, workspace_id: workspace.id }))
        )
        .then(() =>
          models.workspace.findByPk(workspace.id, {
            include: [
              { model: models.domain, as: domainAssociationNames.plural },
            ],
          })
        )
    );
  },
  createProfile({
    workspace_id,
    email,
    name,
    access,
    status,
    is_completed,
  }: {
    workspace_id: string;
    email: string;
    name: string;
    access: ProfileWorkspaceAccess;
    status: ProfileWorkspaceStatus;
    is_completed: boolean;
  }) {
    return models.profile
      .create({ email, password: "123", is_completed, name })
      .then((profile) =>
        models.workspaceProfile
          .create({
            profile_id: profile.id,
            workspace_id,
            access,
            status,
            title: "",
          })
          .then(() =>
            models.profile.findByPk(profile.id, {
              include: [
                {
                  model: models.workspaceProfile,
                  as: workspaceProfileAssociationNames.singular,
                },
              ],
            })
          )
      );
  },
  updateProfile({
    email,
    name,
    access,
    status,
    is_completed,
  }: {
    email: string;
    name?: string;
    access?: ProfileWorkspaceAccess;
    status?: ProfileWorkspaceStatus;
    is_completed?: boolean;
  }) {
    return models.profile
      .findOne({
        where: { email },
        include: [
          {
            model: models.workspaceProfile,
            as: workspaceProfileAssociationNames.singular,
          },
        ],
      })
      .then((match) => {
        if (name) {
          match!.name = name;
        }
        if (is_completed) {
          match!.is_completed = is_completed;
        }
        let workspaceProfileUpdate = Promise.resolve().then(
          () => match!.workspaceProfile
        );
        if (access || status) {
          if (access) {
            match!.workspaceProfile!.access = access;
          }
          if (status) {
            match!.workspaceProfile!.status = status;
          }
          workspaceProfileUpdate = match!.workspaceProfile!.changed()
            ? match!.workspaceProfile!.save()
            : Promise.resolve(match!.workspaceProfile!);
        }
        const profileUpdate = match!.changed()
          ? match!.save()
          : Promise.resolve(match!);
        return Promise.all([profileUpdate, workspaceProfileUpdate]).then(() =>
          models.profile.findOne({
            where: { email },
            include: [
              {
                model: models.workspaceProfile,
                as: workspaceProfileAssociationNames.singular,
                include: [
                  {
                    model: models.workspace,
                    as: workspaceAssociationNames.singular,
                  },
                ],
              },
            ],
          })
        );
      });
  },
  getAuthToken({ email }: { email: string }) {
    return models.profile
      .findOne({
        where: { email: email },
        include: [
          {
            model: models.workspaceProfile,
            as: workspaceProfileAssociationNames.singular,
            include: [
              {
                model: models.workspace,
                as: workspaceAssociationNames.singular,
              },
            ],
          },
        ],
      })
      .then((profile) =>
        createToken<AuthJwtPayload>({
          email: profile!.email,
          id: profile!.id,
          image: profile!.image,
          name: profile!.name,
          workspace: {
            workspace_id: profile!.workspaceProfile!.workspace_id,
            profile_id: profile!.id,
            access: profile!.workspaceProfile!.access,
            status: profile!.workspaceProfile!.status,
            title: profile!.workspaceProfile!.title,
            workspace: profile!.workspaceProfile!.workspace,
          },
        })
      );
  },
  getProfiles(where: {
    email?: string;
    domain?: string;
    workspace_id: string;
  }) {
    const workspaceWhere = where.workspace_id ? { id: where.workspace_id } : {};

    return models.profile.findAll({
      where,
      include: [
        {
          model: models.workspaceProfile,
          as: workspaceProfileAssociationNames.singular,
          include: [
            {
              model: models.workspace,
              as: workspaceAssociationNames.singular,
              where: workspaceWhere,
              include: [
                {
                  model: models.domain,
                  as: domainAssociationNames.plural,
                },
              ],
            },
          ],
        },
      ],
    });
  },
};

export function processOperations(data: any) {
  let chain: Promise<any> = Promise.resolve([]);
  for (const value of data) {
    const { key, data } = value;
    if (!(key in testDatabaseSetup)) continue;
    const thenFn = (prevData: any) => {
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === "string" && /\[(\d+)\]\.(.+)/.test(value)) {
          const [, index, accessor] = /\[(\d+)\]\.(.+)/.exec(value)!;
          data[key] = prevData[index][accessor];
        }
      }
      return testDatabaseSetup[key as keyof typeof testDatabaseSetup](data);
    };
    chain = chain.then((prevData) =>
      thenFn(prevData).then((data) => [...prevData, data])
    );
  }
  return chain;
}

export default testDatabaseSetup;
