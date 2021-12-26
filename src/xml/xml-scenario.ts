import { fetchWithNeedle } from "../adapters/needle";
import { ProtoScenario } from "../scenario";
import { XmlResponse } from "./xml-response";

export class XmlScenario extends ProtoScenario {
  protected createResponse() {
    return new XmlResponse(this);
  }

  protected getRequestAdapter() {
    return fetchWithNeedle;
  }
}
