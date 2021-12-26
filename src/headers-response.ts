import { ProtoResponse } from "./response";
import { iResponse, iValue } from "./interfaces";
import { HttpResponse } from "./http-response";
import { ValuePromise } from "./value-promise";
import { ScenarioType } from "./scenario-types";

export class HeadersResponse extends ProtoResponse implements iResponse {
  public get responseType(): ScenarioType {
    return "headers";
  }

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
