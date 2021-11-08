import { fetchWithNeedle } from "../adapters/needle";
import { ProtoScenario } from "../scenario";
import { HtmlResponse } from "./html-response";

export class HtmlScenario extends ProtoScenario {
  protected responseClass = HtmlResponse;
  protected requestAdapter = fetchWithNeedle;
  protected _createResponse() {
    return new HtmlResponse(this);
  }
}
