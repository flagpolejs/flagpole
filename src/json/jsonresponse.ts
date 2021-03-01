import { ProtoResponse } from "../response";
import { HttpResponse } from "../httpresponse";
import { iResponse, iValue } from "../interfaces";
import { ValuePromise } from "../value-promise";
import { ScenarioType } from "../scenario-types";
import { jpathFind, jpathFindAll, JPathProvider, JsonDoc } from "./jpath";

export class JsonResponse
  extends ProtoResponse
  implements iResponse, JPathProvider {
  public jsonDoc: JsonDoc | undefined;

  public get responseTypeName(): string {
    return "JSON";
  }

  public get responseType(): ScenarioType {
    return "json";
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    this.context
      .assert("JSON is valid", this.jsonBody.$)
      .type.not.equals("null");
  }

  public getRoot(): any {
    return this.jsonBody.$;
  }

  public async eval(): Promise<any> {
    throw "This type of scenario does not suport eval.";
  }

  public find = (path: string): ValuePromise => jpathFind(this, path);
  public findAll = (path: string): Promise<iValue[]> =>
    jpathFindAll(this, path);
}
