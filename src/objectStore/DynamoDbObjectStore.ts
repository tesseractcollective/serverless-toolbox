import ObjectStore, { Action, Reducer, actionHandler } from "./ObjectStore";
import DynamoDbWrapper from "../dynamoDb/DynamoDbWrapper";

export default class DynamoObjectDBStore<T> implements ObjectStore<T> {
  private readonly db: DynamoDbWrapper;
  private readonly tableName: string;
  private readonly timeToLiveSeconds?: number;
  private readonly expiresKey: string;

  constructor(
    tableName: string,
    region: string,
    timeToLiveSeconds?: number,
    expiresKey: string = "expires"
  ) {
    this.db = new DynamoDbWrapper(region);
    this.tableName = tableName;
    this.timeToLiveSeconds = timeToLiveSeconds;
    this.expiresKey = expiresKey;
  }

  private createExpires(timeToLiveSeconds: number) {
    const timestampSeconds = new Date().getTime() / 1000;
    return timestampSeconds + timeToLiveSeconds;
  }

  async get(id: string): Promise<T | undefined> {
    const item = await this.db.get(this.tableName, { id: id });
    if (this.timeToLiveSeconds && item[this.expiresKey]) {
      if (item[this.expiresKey] < Date.now() / 1000) {
        return undefined;
      }
    }
    return item;
  }

  async put(id: string, item: T): Promise<T> {
    const putItem = { ...item, id };
    if (this.timeToLiveSeconds) {
      putItem[this.expiresKey] = this.createExpires(this.timeToLiveSeconds);
    }
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
