import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize-instance";
import {
  DomainModelInstance,
  DomainCreationAttributes,
} from "../interfaces/domain";
import { baseFields, baseModelConfig } from "./base";
import { nginx } from "../../modules/nginx";

export const domainModel = sequelize.define<
  DomainModelInstance,
  DomainCreationAttributes
>(
  "Domain",
  {
    ...baseFields,
    domain: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    workspace_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    ...baseModelConfig,
    tableName: "domains",
    hooks: {
      afterCreate(attributes, options) {
        const { domain } = attributes;
        return nginx
          .createDomainConfiguration(domain)
          .then(() => nginx.testAndReloadServer())
          .then(() => undefined);
      },
      afterUpdate(instance, options) {
        const prevDomain = instance.previous("domain");
        const currentDomain = instance.get("domain");

        if (prevDomain === currentDomain) return;
        const preOperation =
          typeof prevDomain === "string"
            ? nginx.removeDomainConfiguration(prevDomain)
            : Promise.resolve();

        return void preOperation
          .then(() => nginx.createDomainConfiguration(currentDomain))
          .then(() => nginx.testAndReloadServer());
      },
    },
  }
);
