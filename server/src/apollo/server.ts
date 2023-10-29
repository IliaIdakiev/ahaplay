import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { resolvers, typeDefs } from "./config";
import { HttpOrHttpsServer } from "../types/server";
import { AppContext } from "./types/context";

import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { generateRequestContext } from "./utils";
import { Context, OperationResult, SubscribeMessage } from "graphql-ws";
import { ExecutionArgs, ExecutionResult } from "graphql";

function formatError(error: any) {
  console.error(error);
  return {
    message: error.message,
    code: error.extensions?.code,
    locations: error.locations,
    path: error.path,
  };
}

export const createApolloServer = (httpServer: HttpOrHttpsServer) => {
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const serverCleanup = useServer(
    {
      schema,
      context: generateRequestContext,
      onOperation(
        ctx: Context<any, any>,
        message: SubscribeMessage,
        args: ExecutionArgs,
        result: OperationResult
      ) {
        if ("errors" in (result as ExecutionResult)) {
          (result as any).errors = (result as ExecutionResult).errors!.map(
            (e) => formatError(e)
          );
        }
      },
    },
    wsServer
  );

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
    formatError,
  });
};
