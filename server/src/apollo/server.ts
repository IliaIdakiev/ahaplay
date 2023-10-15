import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { resolvers, typeDefs } from "./config";
import { HttpOrHttpsServer } from "../types/server";

export const createApolloServer = (httpServer: HttpOrHttpsServer) =>
  new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: (error) => {
      console.error(error);
      return {
        message: error.message,
        code: error.extensions?.code,
        locations: error.locations,
        path: error.path,
      };
    },
  });
