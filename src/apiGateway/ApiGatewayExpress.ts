import serverlessExpress from "@vendia/serverless-express";
import { Handler } from "aws-lambda";
import express from "express";

import * as log from "../log";
import {
  attachLogInfoMiddleware,
  attachUserAuthMiddleware,
  errorMiddleware,
  notFoundMiddleware,
} from "../express/expressMiddleware";

export type RouterMap = { [path: string]: express.Router };

export default class ApiGatewayExpress {
  readonly app = express();
  readonly routerMap: RouterMap;
  readonly handler: Handler;

  constructor(routerMap: RouterMap) {
    this.routerMap = routerMap;
    this.setupMiddlewareAndRoutes();
    this.handler = serverlessExpress({ app: this.app });
  }

  setupMiddlewareAndRoutes() {
    this.app.use(attachLogInfoMiddleware);
    this.app.use(express.json());
    this.app.use(log.accessLogMiddleware);
    this.app.use(attachUserAuthMiddleware);

    Object.keys(this.routerMap).forEach((path) => {
      this.app.use(path, this.routerMap[path]);
    });

    this.app.use(errorMiddleware);
    this.app.use(notFoundMiddleware);
  }
}
