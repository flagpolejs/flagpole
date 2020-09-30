import { ProtoResponse } from "./response";
import { iResponse, iValue } from "./interfaces";
import { ResponseType } from "./enums";
import { HttpResponse } from "./httpresponse";
import { ValuePromise } from "./value-promise";

export class ResourceResponse extends ProtoResponse implements iResponse {
  public get responseType(): ResponseType {
    return "resource";
  }

  public get responseTypeName(): string {
    return "Resource";
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
  }

  public async eval(): Promise<any> {
    throw "This type of scenario does not suport eval.";
  }

  public find(): ValuePromise {
    throw new Error("Generic Response does not yet support select");
  }

  public async findAll(): Promise<iValue[]> {
    throw new Error("Generic Response does not yet support selectAll");
  }
}
