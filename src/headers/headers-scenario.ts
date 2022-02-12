import { HeadersResponse } from "./headers-response";
import { Scenario } from "../scenario";
import { NeedleAdapter } from "../adapter.needle";

export class HeadersScenario extends Scenario<HeadersResponse> {
  public readonly adapter = new NeedleAdapter();
  public readonly response = new HeadersResponse(this);
  public readonly typeName = "Headers";

  protected _executeHttpRequest() {
    this.setMethod("head");
    super._executeHttpRequest();
  }
}
