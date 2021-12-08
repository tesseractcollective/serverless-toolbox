import { APIGatewayProxyEvent, Context } from "aws-lambda";
import serverlessExpress, {
  getCurrentInvoke,
} from "@vendia/serverless-express";
import bodyParser from "body-parser";
import express, { NextFunction, Request, Response } from "express";

import * as log from "../log";
import HttpError from "./HttpError";

export type RouterMap = { [path: string]: express.Router };

export default class ApiGatewayExpress {
  readonly app = express();
  readonly routerMap: RouterMap;
  readonly handler;

  constructor(routerMap: RouterMap) {
    this.routerMap = routerMap;
    this.setupMiddlewareAndRoutes();
    this.handler = serverlessExpress({ app: this.app });
  }

  attachLogInfoMiddleware(
    request: any,
    response: Response,
    next: NextFunction
  ) {
    request.logInfo = { timestamp: Date.now() };
    next();
  }

  attachUserAuthMiddleware(
    request: any,
    response: Response,
    next: NextFunction
  ) {
    const principalId =
      request.apiGateway?.event?.requestContext?.authorizer?.principalId;
    if (principalId) {
      request.auth = { user: { id: principalId } };
    }
    next();
  }

  setupMiddlewareAndRoutes() {
    this.app.use(this.attachLogInfoMiddleware);
    this.app.use(bodyParser.json());
    this.app.use(log.accessLogMiddleware);
    this.app.use(this.attachUserAuthMiddleware);

    Object.keys(this.routerMap).forEach((path) => {
      this.app.use(path, this.routerMap[path]);
    });

    this.app.use(this.errorMiddleware);
    this.app.use(this.notFoundMiddleware);
  }

  errorMiddleware(
    error: HttpError,
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    log.error(error);
    const statusCode = error.statusCode || 500;
    const message = error.message || "Unexpected Server Error";
    response.status(statusCode).json({ statusCode, message });
  }

  notFoundMiddleware(request: Request, response: Response, next: NextFunction) {
    const statusCode = 404;
    response.status(statusCode).json({ statusCode, message: "Not Found" });
  }
}
