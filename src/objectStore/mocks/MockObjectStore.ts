import ObjectStore, { Action, Reducer } from "../ObjectStore";

export class MockObjectStore<T> implements ObjectStore<T> {
  private store: { [id: string]: T } = {};
  private readonly timeToLiveSeconds?: number;
  private readonly expiresKey: string;

  constructor(timeToLiveSeconds?: number, expiresKey: string = "expires") {
    this.timeToLiveSeconds = timeToLiveSeconds;
    this.expiresKey = expiresKey;
  }

  private createExpires(timeToLiveSeconds: number) {
    const timestampSeconds = new Date().getTime() / 1000;
    return timestampSeconds + timeToLiveSeconds;
  }

  async get(id: string): Promise<T | undefined> {
    const item = this.store[id];
    if (this.timeToLiveSeconds && item && item[this.expiresKey]) {
      if (item[this.expiresKey] < Date.now() / 1000) {
        return Promise.resolve(undefined);
      }
    }
    return Promise.resolve(item);
  }

  async put(id: string, item: T): Promise<T> {
    const putItem = { ...item, id };
    if (this.timeToLiveSeconds) {
      putItem[this.expiresKey] = this.createExpires(this.timeToLiveSeconds);
    }
    this.store[id] = putItem;
    return Promise.resolve(putItem);
  }

  async delete(id: string): Promise<void> {
    delete this.store[id];
    return Promise.resolve();
  }

  async updateState(
    id: string,
    action: Action,
    reducer: Reducer<T>
  ): Promise<T> {
    const item = await this.get(id);
    if (item) {
      const newItem = reducer(item, action);
      await this.put(id, newItem);
      return newItem;
    }
    return Promise.reject("no item");
  }
}
