import { HeadersResponse } from "./headers-response";
import { ProtoScenario } from "../scenario";
import { NeedleAdapter } from "../adapter.needle";

export class HeadersScenario extends ProtoScenario<HeadersResponse> {
  public readonly adapter = new NeedleAdapter();
  public readonly response = new HeadersResponse(this);
  public readonly typeName = "Headers";

  protected _executeHttpRequest() {
    this.setMethod("head");
    super._executeHttpRequest();
  }
}
