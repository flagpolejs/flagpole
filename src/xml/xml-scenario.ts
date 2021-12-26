import { fetchWithNeedle } from "../adapters/needle";
import { ProtoScenario } from "../scenario";
import { XmlResponse } from "./xml-response";

export class XmlScenario extends ProtoScenario {
  public readonly requestAdapter = fetchWithNeedle;
  public readonly response = new XmlResponse(this);
}
