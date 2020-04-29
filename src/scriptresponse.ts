import { ResponseType } from "./enums";
import { iResponse } from "./interfaces";
import { Value } from "./value";
import { ProtoResponse } from "./response";
import { HttpResponse } from "./httpresponse";

export class ScriptResponse extends ProtoResponse implements iResponse {
  public get responseTypeName(): string {
    return "Script";
  }

  public get responseType(): ResponseType {
    return "script";
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    this.context.assert(this.statusCode).between(200, 299);
    this.context
      .assert(
        "MIME Type matches expected value for JavaScript",
        this.header("Content-Type")
      )
      .matches(/(text|application)\/(javascript|ecmascript)/);
  }

  public async evaluate(context: any, callback: Function): Promise<any> {
    throw new Error("Evaluate does not support script resources.");
  }

  public async find(path: string): Promise<Value> {
    throw new Error("Script Response does not yet support select");
  }

  public async findAll(path: string): Promise<Value[]> {
    throw new Error("Script Response does not yet support selectAll");
  }
}
