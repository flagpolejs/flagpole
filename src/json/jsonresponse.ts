import { ProtoResponse } from "../response";
import { JPathProvider, jpathFind, jpathFindAll, JsonDoc } from "./jpath";
import { HttpResponse } from "../httpresponse";
import { iResponse, iValue } from "../interfaces";
import { ResponseType } from "../enums";
import { ValuePromise } from "../value-promise";

export class JsonResponse
  extends ProtoResponse
  implements iResponse, JPathProvider {
  public jsonDoc: JsonDoc | undefined;

  public get responseTypeName(): string {
    return "JSON";
  }

  public get responseType(): ResponseType {
    return "json";
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    const json = this.jsonBody.$;
    this.context.assert("JSON is valid", json).type.not.equals("null");
    this.jsonDoc = new JsonDoc(json || {});
  }

  public getRoot(): any {
    return this.jsonDoc?.root;
  }

  public async eval(): Promise<any> {
    throw "This type of scenario does not suport eval.";
  }

  public find = (path: string): ValuePromise => jpathFind(this, path);
  public findAll = (path: string): Promise<iValue[]> =>
    jpathFindAll(this, path);
}
