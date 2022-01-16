import { ProtoResponse } from "../response";
import { iValue } from "../interfaces/ivalue";
import { HttpResponse } from "../http/http-response";
import { ValuePromise } from "../value-promise";
import { iResponse } from "../interfaces/iresponse";
import { HeadersScenario } from "./headers-scenario";

export class HeadersResponse extends ProtoResponse implements iResponse {
  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
  }

  public find(key: string): ValuePromise {
    return ValuePromise.execute(async () => {
      return this.header(key);
    });
  }

  public async findAll(key: string): Promise<iValue[]> {
    return [this.header(key)];
  }
}
