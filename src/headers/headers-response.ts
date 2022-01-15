import { ProtoResponse } from "../response";
import { iValue } from "../interfaces/ivalue";
import { HttpResponse } from "../http-response";
import { ValuePromise } from "../value-promise";
import { iResponse } from "../interfaces/iresponse";
import { HeadersScenario } from "./headers-scenario";

export class HeadersResponse extends ProtoResponse implements iResponse {
  public get responseTypeName(): string {
    return "Headers";
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
  }

  public async eval(): Promise<any> {
    throw "This type of scenario does not suport eval.";
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
