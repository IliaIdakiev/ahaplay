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
import { environment } from "./env";

const cookieSecret = config.app.cookieSecret;

const app = express();
const httpServer = http.createServer(app);
const apolloServer = createApolloServer(httpServer);

Promise.all([connectSequelize(), connectRedis(), apolloServer.start()]).then(
  ([sequelize]) => {
    console.log("Database connected, Redis connected and apollo is running.");

    app.use(bodyParser.json());
    app.use(cookieParser(cookieSecret));
    app.use(
      "/graphql",
      expressMiddleware(apolloServer, {
        context: ({ req }) => generateRequestContext(req),
      })
    );

    // if(environment === "test")
    if (environment === "dev" && sequelize) {
      app.delete("/recreate-database", (req, res) => {
        sequelize
          .drop({ logging: true })
          .then(() => sequelize.sync())
          .then(() => {
            res.status(200).send("Ok!");
          });
      });
    }

    app.get("/", (req, res) => {
      res.send("HELLO WORLD!");
    });

    app.use(globalErrorHandler);

    httpServer.listen({ port: config.app.port }, () => {
      console.log(`Server working on port ${config.app.port}`);
    });
  }
);
