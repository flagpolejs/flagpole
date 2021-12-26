import { fetchWithNeedle } from "../adapters/needle";
import { ProtoScenario } from "../scenario";
import { SoapResponse } from "./soap-response";

export class SoapScenario extends ProtoScenario {
  protected createResponse() {
    return new SoapResponse(this);
  }

  protected getRequestAdapter() {
    return fetchWithNeedle;
  }
}
