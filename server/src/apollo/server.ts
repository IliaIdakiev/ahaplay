import { Server as HttpsServer } from "https";
import { Server as HttpServer } from "http";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { resolvers, typeDefs } from "./config";

export const createApolloServer = (httpServer: HttpServer | HttpsServer) =>
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
