import { ProtoResponse } from "../response";
import { iValue } from "../interfaces/ivalue";
import { HttpResponse } from "../http/http-response";
import { ValuePromise } from "../value-promise";

export class HeadersResponse extends ProtoResponse {
  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
  }

  public find(key: string): ValuePromise {
    return ValuePromise.execute(async () => {
      return this.header(key);
    });
  }

  public async findAll(key: string): Promise<iValue<any>[]> {
    return [this.header(key)];
  }
}
