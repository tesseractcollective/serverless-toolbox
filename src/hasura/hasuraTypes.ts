// TODO: try apollo-link-batch-http
export type HasuraEventOperation = "INSERT" | "UPDATE" | "DELETE";

export interface HasuraTriggerPayload {
  event: HasuraEvent;
  created_at: string;
  id: string;
  delivery_info: {
    max_retries: number;
    current_retry: number;
  };
  trigger: {
    name: string;
  };
  table: {
    schema: string;
    name: string;
  };
}

export interface HasuraEvent {
  session_variables: {
    [key: string]: string;
  };
  op: HasuraEventOperation;
  data: {
    old: any;
    new: any;
  };
}

export interface HasuraActionPayload {
  action: {
    name: string;
  };
  input: {
    [key: string]: any;
  };
  session_variables: {
    [key: string]: string;
  };
}

export interface HasuraEventHandler {
  handleEvent(payload: HasuraTriggerPayload): Promise<void>;
}

export interface HasuraGraphQLPayload {
  query: string;
  variables?: { [key: string]: any };
}

export interface HasuraUserBase {
  id: string;
  email: string;
}

export interface HasuraUserApi<T extends HasuraUserBase> {
  createUserWithEmail(email: string): Promise<T>;
  getUserById(id: string): Promise<T>;
}
