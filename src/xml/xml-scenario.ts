import { fetchWithNeedle } from "../adapters/needle";
import { ProtoScenario } from "../scenario";
import { XmlResponse } from "./xmlresponse";

export class XmlScenario extends ProtoScenario {
  protected responseClass = XmlResponse;
  protected requestAdapter = fetchWithNeedle;
}
