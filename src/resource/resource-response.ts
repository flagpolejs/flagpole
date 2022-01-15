import { ProtoResponse } from "../response";
import { iResponse } from "../interfaces/iresponse";
import { HttpResponse } from "../http-response";
import { ValuePromise } from "../value-promise";
import { ScenarioType } from "../scenario-types";
import { ResourceScenario } from "./resource-scenario";

export class ResourceResponse extends ProtoResponse implements iResponse {
  public get responseType(): ScenarioType {
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

  public async findAll(): Promise<any[]> {
    throw new Error("Generic Response does not yet support selectAll");
  }
}
