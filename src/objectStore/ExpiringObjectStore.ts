export default interface ExpiringObjectStore<T> {
  get(id: string): Promise<T | undefined>;
  put(id: string, item: T, timeToLiveSeconds: number): Promise<T>;
  delete(id: string): Promise<void>;
}
