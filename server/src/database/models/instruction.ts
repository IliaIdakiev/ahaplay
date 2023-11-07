import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize";
import {
  InstructionModelInstance,
  InstructionCreationAttributes,
} from "../interfaces/instruction";
import { baseFields, baseModelConfig } from "./base";

export const instructionModel = sequelize.define<
  InstructionModelInstance,
  InstructionCreationAttributes
>(
  "Instruction",
  {
    ...baseFields,
    text: {
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
  },
  {
    ...baseModelConfig,
    tableName: "instructions",
  }
);
