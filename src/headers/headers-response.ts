import { ProtoResponse } from "../response";
import { iValue } from "../interfaces/ivalue";
import { HttpResponse } from "../http/http-response";
import { ValuePromise } from "../value-promise";
import { HttpHeaderValue } from "../interfaces/generic-types";
import { Value } from "..";

export class HeadersResponse extends ProtoResponse {
  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
  }

  public find(key: string): ValuePromise<HttpHeaderValue, Value> {
    return ValuePromise.wrap<HttpHeaderValue, Value>(this.header(key));
  }

  public async findAll(key: string): Promise<Value<HttpHeaderValue | null>[]> {
    return [this.header(key)];
  }
}
