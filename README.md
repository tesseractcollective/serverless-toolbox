# serverless-toolbox

## Object stores

An object store is a simple interface to get, put, and delete json documents based on a unique id. This library includes object store implementations for DynamoDB and S3.

```TypeScript
export default interface ObjectStore<T> {
  get(id: string): Promise<T | undefined>;
  put(id: string, item: T): Promise<T>;
  delete(id: string): Promise<void>;
  updateState(id: string, action: Action, reducer: Reducer<T>): Promise<T>;
}
```

## API Gateway

This library provides sensible defaults for API Gateway using express. It also provides a websocket subscription service for API Gateway.

## Hasura

This library provides type definitions and simple helpers for consuming Hasura [actions](https://hasura.io/docs/1.0/graphql/core/actions/index.html) and [events](https://hasura.io/docs/1.0/graphql/core/event-triggers/index.html).

## Auth

This library provides sensible defaults and helpers for hashing and verifying passwords and dealing with tokens.
