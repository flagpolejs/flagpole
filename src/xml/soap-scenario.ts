import { fetchWithNeedle } from "../adapters/needle";
import { ProtoScenario } from "../scenario";
import { SoapResponse } from "./soapresponse";

export class SoapScenario extends ProtoScenario {
  protected responseClass = SoapResponse;
  protected requestAdapter = fetchWithNeedle;
}
