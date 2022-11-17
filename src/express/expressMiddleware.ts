import express, { NextFunction, Request, Response } from "express";
import { log } from "..";
import HttpError from "./HttpError";

export function attachLogInfoMiddleware(
  request: any,
  response: Response,
  next: NextFunction
) {
  request.logInfo = { timestamp: Date.now() };
  next();
}

export function attachUserAuthMiddleware(
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

export function errorMiddleware(
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

export function notFoundMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const statusCode = 404;
  response.status(statusCode).json({ statusCode, message: "Not Found" });
}
