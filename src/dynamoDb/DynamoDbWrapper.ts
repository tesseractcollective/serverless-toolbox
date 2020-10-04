import { DynamoDB, AWSError } from "aws-sdk";
import {
  DocumentClient,
  ScanInput,
  BatchGetRequestMap,
  ScalarAttributeType,
  QueryInput,
  ExpressionAttributeNameMap,
  ExpressionAttributeValueMap,
  BatchWriteItemRequestMap,
} from "aws-sdk/clients/dynamodb";
import ConditionExpression from "./ConditionExpression";
import { buildArn, CloudFormation, IamRoleStatement } from "../awsResource";

export type Key = DocumentClient.Key;

// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html
// https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html
export default class DynamoDbWrapper {
  private readonly ddb: DynamoDB;
  private readonly db: DocumentClient;
  private readonly consistentRead: boolean;

  constructor(region: string, consistentRead: boolean = true) {
    this.ddb = new DynamoDB({ apiVersion: "2012-08-10", region });
    this.db = new DocumentClient({
      service: this.ddb,
      convertEmptyValues: true,
    });
    this.consistentRead = consistentRead;
  }

  private errorWrapper(
    error: AWSError,
    tableName: string,
    action: string
  ): Promise<any> {
    // AWS doesn't namespace errors
    error.code = `DynamoDB:${error.code}`;
    error.message = `DynamoDB:${tableName}:${action} ${error.message}`;
    return Promise.reject(error);
  }

  async get(table: string, key: Key): Promise<any> {
    return this.db
      .get({
        TableName: table,
        Key: key,
        ConsistentRead: this.consistentRead,
      })
      .promise()
      .then((data) => {
        return data?.Item;
      })
      .catch((error) => this.errorWrapper(error, table, "get"));
  }

  async query(
    table: string,
    keyExpression?: ConditionExpression,
    conditionExpression?: ConditionExpression,
    ExclusiveStartKey?: Key,
    items: any = []
  ) {
    const params: QueryInput = {
      TableName: table,
      ConsistentRead: this.consistentRead,
      ExclusiveStartKey,
    };

    let attributeNames: ExpressionAttributeNameMap = {};
    let attributeValues: ExpressionAttributeValueMap = {};
    if (keyExpression) {
      params.KeyConditionExpression = keyExpression.expression;
      if (keyExpression.attributeNames) {
        attributeNames = keyExpression.attributeNames;
        params.ExpressionAttributeNames = attributeNames;
      }
      if (keyExpression.attributeValues) {
        attributeValues = keyExpression.attributeValues;
        params.ExpressionAttributeValues = keyExpression.attributeValues;
      }
    }
    if (conditionExpression) {
      params.FilterExpression = conditionExpression.expression;
      if (conditionExpression.attributeNames) {
        params.ExpressionAttributeNames = {
          ...attributeNames,
          ...conditionExpression.attributeNames,
        };
      }
      if (conditionExpression.attributeValues) {
        params.ExpressionAttributeValues = {
          ...attributeValues,
          ...conditionExpression.attributeValues,
        };
      }
    }

    return this.db
      .query(params)
      .promise()
      .then((data) => {
        if (data.Items) {
          items = items.concat(data.Items);
        }
        if (data.LastEvaluatedKey) {
          // recursively call due to paginated results
          return this.query(
            table,
            keyExpression,
            conditionExpression,
            data.LastEvaluatedKey,
            items
          );
        }
        return items;
      })
      .catch((error) => this.errorWrapper(error, table, "query"));
  }

  async scan(
    table: string,
    conditionExpression?: ConditionExpression,
    ExclusiveStartKey?: Key,
    items: any = []
  ) {
    const params: ScanInput = {
      TableName: table,
      ConsistentRead: this.consistentRead,
      ExclusiveStartKey,
    };
    if (conditionExpression) {
      params.FilterExpression = conditionExpression.expression;
      params.ExpressionAttributeNames = conditionExpression.attributeNames;
      params.ExpressionAttributeValues = conditionExpression.attributeValues;
    }

    return this.db
      .scan(params)
      .promise()
      .then((data) => {
        if (data.Items) {
          items = items.concat(data.Items);
        }
        if (data.LastEvaluatedKey) {
          // recursively call due to paginated results
          return this.scan(
            table,
            conditionExpression,
            data.LastEvaluatedKey,
            items
          );
        }
        return items;
      })
      .catch((error) => this.errorWrapper(error, table, "scan"));
  }

  async batchGet(table: string, keys: Key[]) {
    const requestMap = {
      [table]: {
        Keys: keys,
        ConsistentRead: this.consistentRead,
      },
    };
    return this.batchGetWithRequestMap(table, requestMap);
  }

  async put(table: string, item: any, conditionExpression?: string) {
    return this.db
      .put({
        TableName: table,
        Item: item,
        ConditionExpression: conditionExpression,
      })
      .promise()
      .catch((error) => this.errorWrapper(error, table, "put"));
  }

  async batchPut(table: string, items: any[]) {
    const requestMap: BatchWriteItemRequestMap = {
      [table]: items.map((item) => ({ PutRequest: { Item: item } })),
    };
    return this.batchWriteWithRequestMap(table, requestMap);
  }

  async delete(table: string, key: Key) {
    return this.db
      .delete({
        TableName: table,
        Key: key,
      })
      .promise()
      .catch((error) => this.errorWrapper(error, table, "delete"));
  }

  async batchDelete(table: string, keys: Key[]) {
    const requestMap: BatchWriteItemRequestMap = {
      [table]: keys.map((key) => ({ DeleteRequest: { Key: key } })),
    };
    return this.batchWriteWithRequestMap(table, requestMap);
  }

  static iamRoleStatementForTable = function (name: string): IamRoleStatement {
    return {
      Effect: "Allow",
      Action: [
        "dynamodb:DescribeTable",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem",
      ],
      Resource: buildArn("dynamodb", `table/${name}`),
    };
  };

  static cloudFormationForTable = function (
    name: string,
    primaryKey: { name: string; type: ScalarAttributeType },
    secondaryKey?: { name: string; type: ScalarAttributeType }
  ): CloudFormation {
    const attributes = [
      { AttributeName: primaryKey.name, AttributeType: primaryKey.type },
    ];
    const keySchema = [{ AttributeName: primaryKey.name, KeyType: "HASH" }];
    if (secondaryKey) {
      attributes.push({
        AttributeName: secondaryKey.name,
        AttributeType: secondaryKey.type,
      });
      keySchema.push({ AttributeName: secondaryKey.name, KeyType: "RANGE" });
    }
    return {
      Type: "AWS::DynamoDB::Table",
      Properties: {
        TableName: name,
        AttributeDefinitions: attributes,
        KeySchema: keySchema,
        BillingMode: "PAY_PER_REQUEST",
      },
    };
  };

  static cloudFormationForTableWithId = function (
    name: string
  ): CloudFormation {
    return this.cloudFormationForTable(name, { name: "id", type: "S" });
  };

  private async batchGetWithRequestMap(
    table: string,
    requestMap: BatchGetRequestMap,
    items: any[] = []
  ) {
    return this.db
      .batchGet({ RequestItems: requestMap })
      .promise()
      .then((data) => {
        if (!data.Responses) {
          return items;
        }
        items = items.concat(data.Responses[table]);
        if (
          data.UnprocessedKeys &&
          Object.keys(data.UnprocessedKeys).length > 0
        ) {
          // recursively call due to paginated results
          return this.batchGetWithRequestMap(
            table,
            data.UnprocessedKeys,
            items
          );
        }
        return items;
      })
      .catch((error) => this.errorWrapper(error, table, "batchGet"));
  }

  private async batchWriteWithRequestMap(
    table: string,
    requestMap: BatchWriteItemRequestMap
  ) {
    return this.db
      .batchWrite({ RequestItems: requestMap })
      .promise()
      .then((data) => {
        if (
          data.UnprocessedItems &&
          Object.keys(data.UnprocessedItems).length > 0
        ) {
          // recursively call due to paginated results
          return this.batchWriteWithRequestMap(table, data.UnprocessedItems);
        }
      })
      .catch((error) => this.errorWrapper(error, table, "batchGet"));
  }
}
