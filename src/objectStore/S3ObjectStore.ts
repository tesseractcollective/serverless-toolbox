import ObjectStore, { Action, Reducer, actionHandler } from "./ObjectStore";
import S3Wrapper from "../s3/S3Wrapper";

export default class S3ObjectStore<T> implements ObjectStore<T> {
  private readonly s3: S3Wrapper;
  private readonly bucketName: string;
  private readonly keyPrefix: string;

  constructor(bucketName: string, keyPrefix: string = "data") {
    this.s3 = new S3Wrapper();
    this.bucketName = bucketName;
    this.keyPrefix = keyPrefix;
  }

  private s3KeyForId(id: string) {
    return `${this.keyPrefix}/${id}.json`;
  }

  async get(id: string): Promise<T | undefined> {
    return this.s3.getJson(this.bucketName, this.s3KeyForId(id));
  }

  async put(id: string, value: T): Promise<T> {
    if (!value) {
      return Promise.reject(new Error("Value is required"));
    }
    const putValue = { ...value, id };
    return this.s3
      .putJson(this.bucketName, this.s3KeyForId(id), putValue)
      .then(() => putValue);
  }

  async delete(id: string) {
    return this.s3.delete(this.bucketName, this.s3KeyForId(id));
  }

  async updateState(
    id: string,
    action: Action,
    reducer: Reducer<T>
  ): Promise<T> {
    return actionHandler(this, id, action, reducer);
  }
}
