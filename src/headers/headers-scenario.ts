import { HeadersResponse } from "./headers-response";
import { fetchWithNeedle } from "../needle";
import { ProtoScenario } from "../scenario";

export class HeadersScenario extends ProtoScenario {
  public readonly adapter = fetchWithNeedle;
  public readonly response = new HeadersResponse(this);

  protected _executeHttpRequest() {
    this.setMethod("head");
    super._executeHttpRequest();
  }
}
