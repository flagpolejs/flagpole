import { ProtoResponse } from "../proto-response";
import { HttpResponse } from "../http/http-response";
import { ValuePromise } from "../value-promise";
import { HttpHeaderValue } from "../interfaces/generic-types";
import { GenericValue } from "../values/generic-value";

export class HeadersResponse extends ProtoResponse {
  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
  }

  public find(key: string) {
    return ValuePromise.wrap(this.header(key));
  }

  public async findAll(
    key: string
  ): Promise<GenericValue<HttpHeaderValue | null>[]> {
    return [this.header(key)];
  }
}
