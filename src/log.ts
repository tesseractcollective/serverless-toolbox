const isDebug = process.env.DEBUG || true;

export function debug(...args: any) {
  if (!isDebug) return;
  console.log(...args);
}

export function info(...args: any) {
  console.log(...args);
}

export function error(...args: any) {
  console.error(...args);
}

function logHttpAccessFromExpress(req: any, res: any) {
  const now = Date.now();
  let ip = req.ip;
  if (!ip && req.apiGateway && req.apiGateway.event) {
    ip = req.apiGateway.event.requestContext.identity.sourceIp;
  }
  let requester: string;
  if (req.auth && req.auth.user) {
    requester = `[User:${req.auth.user.id}]`;
  } else if (req.auth && req.auth.device) {
    requester = `[Device:${req.auth.device.id}]`;
  } else {
    requester = "[NoAuthorization]";
  }
  const requestContentLength = req.headers["content-length"] || 0;
  const responseContentLength = res.getHeaders()["content-length"] || 0;
  const responseTime = now - req.logInfo?.timestamp;

  info(
    req.method,
    req.originalUrl,
    res.statusCode,
    requester,
    ip,
    `request:${requestContentLength}B`,
    `response:${responseContentLength}B`,
    `${responseTime}ms`
  );
}

export async function accessLogMiddleware(req: any, res: any, next: any) {
  res.once("finish", () => {
    logHttpAccessFromExpress(req, res);
  });
  next();
}

export function logApiGatewayWebsocket(
  routeKey: string,
  endpoint: string,
  connectionId: string,
  message?: string
) {
  info(routeKey, endpoint, connectionId, message);
}

export function logApiGatewayEvent(
  event: any,
  options?: { onlyWhenDebug: boolean }
) {
  const logger = options?.onlyWhenDebug ? debug : info;

  logger(JSON.stringify(event));
  if (event.body) {
    logger(event.body);
  }
}
