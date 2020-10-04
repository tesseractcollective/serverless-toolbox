// logs
export * as log from "./log";

// utilities
export * from "./utilities";

// Object Stores
import ObjectStore, {
  Action,
  Reducer,
  actionHandler,
} from "./objectStore/ObjectStore";
import DynamoDbObjectStore from "./objectStore/DynamoDbObjectStore";
import S3ObjectStore from "./objectStore/S3ObjectStore";
export {
  ObjectStore,
  Action,
  Reducer,
  actionHandler,
  DynamoDbObjectStore,
  S3ObjectStore,
};

// DynamoDB
import DynamoDbWrapper from "./dynamoDb/DynamoDbWrapper";
import ConditionExpression from "./dynamoDb/ConditionExpression";
import UpdateExpression from "./dynamoDb/UpdateExpression";
export { DynamoDbWrapper, ConditionExpression, UpdateExpression };

// S3
import S3Wrapper from "./s3/S3Wrapper";
export { S3Wrapper };

// Auth
import PasswordAuth, { PasswordHash } from "./auth/PasswordAuth";
export * from "./auth/Auth";
export { PasswordAuth, PasswordHash };

// API Gateway
import ApiGatewayExpress from "./apiGateway/ApiGatewayExpress";
import ApiGatewayWebSockets, {
  ApiGatewayWebSocketEvent,
  ApiGatewayWebSocketResult,
} from "./apiGateway/ApiGatewayWebSockets";
import ApiGatewayWebSocketSubscriptions from "./apiGateway/ApiGatewayWebSocketSubscriptions";
import SubscriptionHandler, {
  Subscription,
  Subscriber,
} from "./apiGateway/SubscriptionHandler";
import HttpError from "./apiGateway/HttpError";
export {
  ApiGatewayExpress,
  ApiGatewayWebSockets,
  ApiGatewayWebSocketEvent,
  ApiGatewayWebSocketResult,
  SubscriptionHandler,
  ApiGatewayWebSocketSubscriptions,
  HttpError,
  Subscription,
  Subscriber,
};

// AWS Resources
export * from "./awsResource";

// Hasura
import HasuraApi from "./hasura/HasuraApi";
export * from "./hasura/hasuraTypes";
export * from "./hasura/hasuraHelpers";
export { HasuraApi };
