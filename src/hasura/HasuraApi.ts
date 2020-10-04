import { HttpError } from "..";
import { HasuraGraphQLPayload } from "./hasuraTypes";

export default class HasuraApi {
  private readonly fetch: any;
  private readonly url: string;
  private readonly token: string;
  private readonly isAdmin: boolean;

  constructor(
    fetch: any,
    url: string,
    token: string,
    isAdmin: boolean = false
  ) {
    this.fetch = fetch;
    this.url = url;
    this.token = token;
    this.isAdmin = isAdmin;
  }

  async hasuraRequest(payload: HasuraGraphQLPayload): Promise<any> {
    const headers: any = {
      "Content-Type": "application/json",
    };
    if (this.isAdmin) {
      headers["X-Hasura-Admin-Secret"] = this.token;
    } else {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return this.fetch(this.url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });
  }

  async executeHasuraQuery(
    payload: HasuraGraphQLPayload,
    key: string
  ): Promise<any> {
    try {
      const response = await this.hasuraRequest(payload);
      const body = await response.json();
      if (body.errors) {
        console.log(JSON.stringify(payload, null, 2));
        return Promise.reject(
          new HttpError(
            400,
            body.errors.map((e: Error) => e.message).join(", ")
          )
        );
      }

      const data = body.data[key];
      if (key.endsWith("_by_pk") && !data) {
        return Promise.reject(new HttpError(404, "not found"));
      }

      return data;
    } catch (error) {
      console.log(JSON.stringify(payload, null, 2));
      return Promise.reject(new HttpError(500, error.message));
    }
  }
}
