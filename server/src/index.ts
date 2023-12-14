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
import { processOperations } from "./test-database-setup";
import { exec } from "./exec";

const cookieSecret = config.app.cookieSecret;

const app = express();
const httpServer = http.createServer(app);
const apolloServer = createApolloServer(httpServer);

Promise.all([connectSequelize(), connectRedis(), apolloServer.start()]).then(
  ([result]) => {
    const { sequelize } = result || {};
    console.log("Database connected, Redis connected and apollo is running.");

    app.use(bodyParser.json());
    app.use(cookieParser(cookieSecret));
    app.use(
      "/graphql",
      expressMiddleware(apolloServer, {
        context: ({ req }) => generateRequestContext(req),
      })
    );

    if (environment === "test" && sequelize) {
      app.post("/recreate-database", (req, res) => {
        const data = req.body;
        sequelize
          .drop({ logging: true })
          .then(() => sequelize.sync())
          .then(() =>
            exec(
              `npx sequelize db:seed:all --config ./config/db.config.test.json`
            )
          )
          .then(() => processOperations(data))
          .then((data) => {
            res.send(data);
          })
          .catch((err) => {
            console.error(err);
            res.status(500).send(err.message);
          });
      });

      app.post("/process-operations", (req, res) => {
        const data = req.body;
        processOperations(data)
          .then((data) => {
            res.send(data);
          })
          .catch((err) => {
            console.error(err);
            res.status(500).send(err.message);
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
