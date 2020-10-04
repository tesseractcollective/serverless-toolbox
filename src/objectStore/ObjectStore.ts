export default interface ObjectStore<T> {
  get(id: string): Promise<T | undefined>;
  put(id: string, item: T): Promise<T>;
  delete(id: string): Promise<void>;
  updateState(id: string, action: Action, reducer: Reducer<T>): Promise<T>;
}

// Follows Flux Standard Actions (see https://github.com/redux-utilities/flux-standard-action)
export interface Action {
  type: string;
  payload?: { [key: string]: any };
  meta?: { [key: string]: any };
  error?: boolean;
}

// pure function that produces new state (see https://redux.js.org/basics/reducers/#handling-actions)
export type Reducer<T> = (state: T, action: Action) => T;

export async function actionHandler<T>(
  store: ObjectStore<T>,
  id: string,
  action: Action,
  reducer: Reducer<T>
): Promise<T> {
  try {
    let state = await store.get(id);
    if (state) {
      state = reducer(state, action);
      return store.put(id, state);
    } else {
      return Promise.reject(`no item found with id ${id}`);
    }
  } catch (error) {
    return Promise.reject(error);
  }
}
