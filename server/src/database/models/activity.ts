import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize";
import {
  ActivityModelInstance,
  ActivityCreationAttributes,
} from "../interfaces/activity";
import { baseFields, baseModelConfig } from "./base";

export const activityModel = sequelize.define<
  ActivityModelInstance,
  ActivityCreationAttributes
>(
  "Activity",
  {
    ...baseFields,
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sequence_number: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },
    workshop_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    ...baseModelConfig,
    tableName: "activities",
  }
);

activityModel.prototype.isTheory = function (this: ActivityModelInstance) {
  return !!this.theory;
};

activityModel.prototype.isAssignment = function (this: ActivityModelInstance) {
  return !!this.assignment;
};

activityModel.prototype.isQuestion = function (this: ActivityModelInstance) {
  return !!this.question;
};

activityModel.prototype.isBenchmark = function (this: ActivityModelInstance) {
  return !!this.benchmark;
};

activityModel.prototype.isConceptualization = function (
  this: ActivityModelInstance
) {
  return !!this.conceptualization;
};

activityModel.prototype.isConcept = function (this: ActivityModelInstance) {
  return !!this.concept;
};

activityModel.prototype.getGroupDuration = function (
  this: ActivityModelInstance
) {
  return (
    this.benchmark?.g_duration ||
    this.question?.g_duration ||
    this.conceptualization?.g_duration ||
    null
  );
};

activityModel.prototype.getProfileDuration = function (
  this: ActivityModelInstance
) {
  return (
    this.benchmark?.i_duration ||
    this.question?.i_duration ||
    this.conceptualization?.i_duration ||
    null
  );
};

activityModel.prototype.getDuration = function (this: ActivityModelInstance) {
  return this.assignment?.duration || this.theory?.duration || null;
};
