import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize-instance";
import {
  AuthorChallengeModelInstance,
  AuthorChallengeCreationAttributes,
} from "../interfaces/author-challenge";
import { baseFields } from "./base";

export const authorChallengeModel = sequelize.define<
  AuthorChallengeModelInstance,
  AuthorChallengeCreationAttributes
>(
  "AuthorChallenge",
  {
    id: baseFields.id,
    profile_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    activity_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    workshop_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    challenge: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    create_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "author_challenges",
    timestamps: false,
  }
);
