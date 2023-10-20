import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { resolvers, typeDefs } from "./config";
import { HttpOrHttpsServer } from "../types/server";
import { AppContext } from "./typings";

import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";

export const createApolloServer = (httpServer: HttpOrHttpsServer) => {
  
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/subscriptions",
  });

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const serverCleanup = useServer({ schema }, wsServer);

  return new ApolloServer<AppContext>({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
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
};
