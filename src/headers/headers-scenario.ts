import { HeadersResponse } from "./headers-response";
import { Scenario } from "../scenario";
import { NeedleAdapter } from "../adapter.needle";
import { HttpRequest, Value } from "..";

export class HeadersScenario extends Scenario {
  public readonly typeName = "Headers";
  public readonly request = new HttpRequest(this.opts);
  public readonly adapter = new NeedleAdapter();
  public readonly response: HeadersResponse = new HeadersResponse(this);

  protected _executeHttpRequest() {
    this.setMethod("head");
    super._executeHttpRequest();
  }
}
