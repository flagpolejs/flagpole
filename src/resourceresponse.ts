import { ProtoResponse } from "./response";
import { iResponse, iValue } from "./interfaces";
import { ResponseType } from "./enums";
import { HttpResponse } from "./httpresponse";

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

  public async evaluate(context: any, callback: Function): Promise<any> {
    throw new Error("Evaluate does not support generic resources.");
  }

  public async find(path: string): Promise<iValue> {
    throw new Error("Generic Response does not yet support select");
  }

  public async findAll(path: string): Promise<iValue[]> {
    throw new Error("Generic Response does not yet support selectAll");
  }
}
