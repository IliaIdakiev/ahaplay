import { GraphQLScalarType, Kind } from "graphql";
import gql from "graphql-tag";

export const customTypesTypeDefs = gql`
  scalar Date
`;

const DateType = new GraphQLScalarType({
  name: "Date",
  description: "Date scalar type",
  serialize(value) {
    if (value instanceof Date) {
      return value.getTime();
    }
    return null;
  },
  parseValue(value) {
    if (typeof value === "number") {
      return new Date(value);
    }
    return null;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10));
    }
    return null;
  },
});

export const customTypesResolvers = {
  Date: DateType,
};
