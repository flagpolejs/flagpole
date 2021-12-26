import { HeadersResponse } from "./headers-response";
import { fetchWithNeedle } from "../adapters/needle";
import { ProtoScenario } from "../scenario";

export class HeadersScenario extends ProtoScenario {
  protected createResponse() {
    return new HeadersResponse(this);
  }

  protected getRequestAdapter() {
    return fetchWithNeedle;
  }

  protected _executeHttpRequest() {
    this.setMethod("head");
    super._executeHttpRequest();
  }
}
