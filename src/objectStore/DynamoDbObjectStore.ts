import ObjectStore, { Action, Reducer, actionHandler } from "./ObjectStore";
import DynamoDbWrapper from "../dynamoDb/DynamoDbWrapper";

export default class DynamoObjectDBStore<T> implements ObjectStore<T> {
  private readonly db: DynamoDbWrapper;
  private readonly tableName: string;

  constructor(tableName: string, region: string) {
    this.db = new DynamoDbWrapper(region);
    this.tableName = tableName;
  }

  async get(id: string): Promise<T | undefined> {
    return this.db.get(this.tableName, { id: id });
  }

  async put(id: string, item: T): Promise<T> {
    const putItem = { ...item, id };
    return this.db.put(this.tableName, putItem);
  }

  async delete(id: string) {
    return this.db.delete(this.tableName, { id });
  }

  async updateState(
    id: string,
    action: Action,
    reducer: Reducer<T>
  ): Promise<T> {
    return actionHandler(this, id, action, reducer);
  }
}
