import { iResponse } from "./interfaces";
import { Value } from "./value";
import { ProtoResponse } from "./response";
import { HttpResponse } from "./httpresponse";
import { ValuePromise } from "./value-promise";
import { ScenarioType } from "./scenario-types";

export class ScriptResponse extends ProtoResponse implements iResponse {
  public get responseTypeName(): string {
    return "Script";
  }

  public get responseType(): ScenarioType {
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

  public async eval(): Promise<any> {
    throw "This type of scenario does not suport eval.";
  }

  public find(): ValuePromise {
    throw new Error("Script Response does not yet support select");
  }

  public async findAll(): Promise<Value[]> {
    throw new Error("Script Response does not yet support selectAll");
  }
}
