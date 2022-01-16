import { fetchWithNeedle } from "../http/needle";
import { ProtoScenario } from "../scenario";
import { XmlResponse } from "./xml-response";

export class XmlScenario extends ProtoScenario {
  public readonly adapter = fetchWithNeedle;
  public readonly response = new XmlResponse(this);
  public readonly typeName = "XML";
}
