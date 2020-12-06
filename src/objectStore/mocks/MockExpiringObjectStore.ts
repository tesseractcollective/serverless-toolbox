import ExpiringObjectStore from "../ExpiringObjectStore";

export class MockExpiringObjectStore<T> implements ExpiringObjectStore<T> {
  private store: { [id: string]: T } = {};
  private readonly expiresKey: string;

  constructor(expiresKey: string = "expires") {
    this.expiresKey = expiresKey;
  }

  private createExpires(timeToLiveSeconds: number) {
    const timestampSeconds = new Date().getTime() / 1000;
    return timestampSeconds + timeToLiveSeconds;
  }

  async get(id: string): Promise<T | undefined> {
    const item = this.store[id];
    if (item && item[this.expiresKey]) {
      if (item[this.expiresKey] < Date.now() / 1000) {
        return Promise.resolve(undefined);
      }
    }
    return Promise.resolve(item);
  }

  async put(id: string, item: T, timeToLiveSeconds: number): Promise<T> {
    const putItem = { ...item, id };
    if (timeToLiveSeconds) {
      putItem[this.expiresKey] = this.createExpires(timeToLiveSeconds);
    }
    this.store[id] = putItem;
    return Promise.resolve(putItem);
  }

  async delete(id: string): Promise<void> {
    delete this.store[id];
    return Promise.resolve();
  }
}
