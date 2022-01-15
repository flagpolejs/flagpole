import { ProtoResponse } from "../response";
import { iResponse } from "../interfaces/iresponse";
import { HttpResponse } from "../http-response";
import { ValuePromise } from "../value-promise";

export class ResourceResponse extends ProtoResponse implements iResponse {
  public readonly responseTypeName = "Resource";

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
  }

  public async eval(): Promise<any> {
    throw "This type of scenario does not suport eval.";
  }

  public find(): ValuePromise {
    throw new Error("Generic Response does not yet support select");
  }

  public async findAll(): Promise<any[]> {
    throw new Error("Generic Response does not yet support selectAll");
  }
}
