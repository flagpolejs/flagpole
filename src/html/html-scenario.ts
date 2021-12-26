import { fetchWithNeedle } from "../adapters/needle";
import { ProtoScenario } from "../scenario";
import { HtmlResponse } from "./html-response";

export class HtmlScenario extends ProtoScenario {
  protected createResponse() {
    return new HtmlResponse(this);
  }

  protected getRequestAdapter() {
    return fetchWithNeedle;
  }
}
