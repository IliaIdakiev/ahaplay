import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import config from "./config";
import { expressMiddleware } from "@apollo/server/express4";
import { connectSequelize } from "./database";
import { connectRedis } from "./redis";
import { createApolloServer } from "./apollo";
import { globalErrorHandler } from "./global-error-handler";
import { generateRequestContext } from "./apollo";

const cookieSecret = config.app.cookieSecret;

const app = express();
const httpServer = http.createServer(app);
const apolloServer = createApolloServer(httpServer);

Promise.all([connectSequelize(), connectRedis(), apolloServer.start()]).then(
  () => {
    console.log("Database connected, Redis connected and apollo is running.");

    app.use(bodyParser.json());
    app.use(cookieParser(cookieSecret));
    app.use(
      "/graphql",
      expressMiddleware(apolloServer, {
        context: generateRequestContext,
      })
    );

    app.use(globalErrorHandler);

    httpServer.listen({ port: config.app.port }, () => {
      console.log(`Server working on port ${config.app.port}`);
    });
  }
);
