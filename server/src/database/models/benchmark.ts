import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize";
import {
  BenchmarkModelInstance,
  BenchmarkCreationAttributes,
} from "../interfaces/benchmark";

export const benchmarkModel = sequelize.define<
  BenchmarkModelInstance,
  BenchmarkCreationAttributes
>(
  "Benchmark",
  {
    baseline: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    g_duration: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },
    i_duration: {
      type: DataTypes.NUMBER,
      allowNull: false,
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    activity_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    conceptualization_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "benchmarks",
    timestamps: false,
  }
);
