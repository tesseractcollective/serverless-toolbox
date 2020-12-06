import ExpiringObjectStore from "./ExpiringObjectStore";
import DynamoDbWrapper from "../dynamoDb/DynamoDbWrapper";

export default class DynamoObjectDBStore<T> implements ExpiringObjectStore<T> {
  private readonly db: DynamoDbWrapper;
  private readonly tableName: string;
  private readonly expiresKey: string;

  constructor(
    tableName: string,
    region: string,
    expiresKey: string = "expires"
  ) {
    this.db = new DynamoDbWrapper(region);
    this.tableName = tableName;
    this.expiresKey = expiresKey;
  }

  private createExpires(timeToLiveSeconds: number) {
    const timestampSeconds = new Date().getTime() / 1000;
    return timestampSeconds + timeToLiveSeconds;
  }

  async get(id: string): Promise<T | undefined> {
    const item = await this.db.get(this.tableName, { id: id });
    if (item && item[this.expiresKey]) {
      if (item[this.expiresKey] < Date.now() / 1000) {
        return undefined;
      }
    }
    return item;
  }

  async put(id: string, item: T, timeToLiveSeconds: number): Promise<T> {
    const putItem = { ...item, id };
    if (timeToLiveSeconds) {
      putItem[this.expiresKey] = this.createExpires(timeToLiveSeconds);
    }
    return this.db.put(this.tableName, putItem);
  }

  async delete(id: string) {
    return this.db.delete(this.tableName, { id });
  }
}
