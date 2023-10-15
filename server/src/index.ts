import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import config from "./config";
import { expressMiddleware } from "@apollo/server/express4";
import { connect } from "./database";
import { createApolloServer } from "./apollo";
import { globalErrorHandler } from "./global-error-handler";

const cookieSecret = config.app.cookieSecret;

const app = express();
const httpServer = http.createServer(app);
const apolloServer = createApolloServer(httpServer);

Promise.all([connect(), apolloServer.start()]).then(() => {
  console.log("Database connected and apollo server started.");

  app.use(bodyParser.json());
  app.use(cookieParser(cookieSecret));
  app.use("/graphql", expressMiddleware(apolloServer));

  app.use(globalErrorHandler);

  httpServer.listen({ port: config.app.port }, () => {
    console.log(`Server working on port ${config.app.port}`);
  });
});
