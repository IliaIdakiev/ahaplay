import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize-instance";
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
      type: DataTypes.STRING(2500),
      allowNull: false,
    },
    g_duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    i_duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reference: {
      type: DataTypes.STRING(2500),
      allowNull: false,
    },
    activity_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    conceptualization_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "benchmarks",
    timestamps: false,
  }
);
