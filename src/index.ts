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
import ExpiringObjectStore from "./objectStore/ExpiringObjectStore";
import DynamoDbObjectStore from "./objectStore/DynamoDbObjectStore";
import DynamoDbExpiringObjectStore from "./objectStore/DynamoDbExpiringObjectStore";
import S3ObjectStore from "./objectStore/S3ObjectStore";
export {
  ObjectStore,
  ExpiringObjectStore,
  Action,
  Reducer,
  actionHandler,
  DynamoDbObjectStore,
  DynamoDbExpiringObjectStore,
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
import JwtAuth, {
  JwtConfiguration,
  JwtData,
  User,
  UserIdBox,
} from "./auth/JwtAuth";
export * from "./auth/Auth";
export {
  JwtAuth,
  JwtConfiguration,
  JwtData,
  User,
  UserIdBox,
  PasswordAuth,
  PasswordHash,
};

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

// Notifications
import SesEmail from "./notifications/SesEmail";
import SnsSms from "./notifications/SnsSms";
export { SesEmail, SnsSms };

// AWS Resources
export * from "./awsResource";
