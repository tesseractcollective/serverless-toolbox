import { Context } from "aws-lambda";

import SubscriptionHandler, {
  WebSocketSubscriber,
} from "./SubscriptionHandler";
import { TokenAuth, log } from "../index";
import ApiGatewayWebSockets, {
  ApiGatewayWebSocketEvent,
  ApiGatewayWebSocketResult,
} from "./ApiGatewayWebSockets";

export default class ApiGatewayWebSocketSubscriptions {
  subscriptionHandler: SubscriptionHandler;
  auth: TokenAuth;
  scopes: string[];

  constructor(
    subscriptionHandler: SubscriptionHandler,
    auth: TokenAuth,
    scopes: string[]
  ) {
    this.subscriptionHandler = subscriptionHandler;
    this.auth = auth;
    this.scopes = scopes;
  }

  async handler(
    event: ApiGatewayWebSocketEvent,
    context: Context
  ): Promise<ApiGatewayWebSocketResult> {
    const connectionId = event.requestContext.connectionId;
    const routeKey = event.requestContext.routeKey;
    const domain = event.requestContext.domainName;
    const stage = event.requestContext.stage;
    const headers = event.headers;

    let endpoint = `https://${domain}`;
    if (domain === "localhost") {
      endpoint = "http://localhost:3001";
    } else if (domain.includes("amazonaws.com")) {
      endpoint = `https://${domain}/${stage}`;
    }

    log.logApiGatewayWebsocket(routeKey, endpoint, connectionId);

    try {
      const verifyAndStoreConnection = async (authorization: string) => {
        const id = await this.auth.verifyToken(authorization);
        log.info(id);
        const subscriber = new WebSocketSubscriber(connectionId, endpoint);
        await this.subscriptionHandler.subscribe(id, subscriber);
      };

      switch (routeKey) {
        case "$connect": {
          const authorization = headers?.Authorization;
          if (authorization) {
            await verifyAndStoreConnection(authorization);
          }
          break;
        }
        case "$disconnect":
          await this.subscriptionHandler.unsubscribe(connectionId);
          break;
        case "$default": {
          if (event.body) {
            const message = JSON.parse(event.body);
            if (message.authorization) {
              await verifyAndStoreConnection(message.authorization);
              break;
            }
          }
          throw new Error(`incoming messages not supported`);
        }
      }
    } catch (error) {
      error.statusCode = error.statusCode || 500;
      log.error(error);
      // TODO: this doesn't work on $connect since it needs the 200 first
      await ApiGatewayWebSockets.sendWebSocketMessage(
        connectionId,
        endpoint,
        `${error}`
      );
    }
    return { statusCode: 200 };
  }
}
