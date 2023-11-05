import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { resolvers, typeDefs } from "./config";
import { HttpOrHttpsServer } from "../types/server";
import { AppContext } from "./types/context";

import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { Context, OperationResult, SubscribeMessage } from "graphql-ws";
import { ExecutionArgs, ExecutionResult } from "graphql";
import { AuthError } from "./types";
import { decodeToken, readAuthToken, verifyToken } from "../modules";
import { AuthJwtPayload } from "src/types";
import { pubSub } from "./pub-sub";

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
      context({ connectionParams }) {
        const token = readAuthToken({ headers: connectionParams })!;
        return decodeToken<AuthJwtPayload>(token).then((decoded) => {
          const context: AppContext = {
            pubSub: pubSub,
            authenticatedProfile: {
              profileId: decoded.id,
              workspaceId: decoded.active_workspace_id,
            },
          };
          return context;
        });
      },
      onConnect({ connectionParams }) {
        const token = readAuthToken({ headers: connectionParams });
        if (!token) {
          return Promise.reject(AuthError.INVALID_CREDENTIALS);
        }
        return verifyToken(token);
      },
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

  const server = new ApolloServer<AppContext>({
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

  return server;
};
