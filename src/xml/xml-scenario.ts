import { NeedleAdapter } from "../adapter.needle";
import { ProtoScenario } from "../scenario";
import { XmlResponse } from "./xml-response";

export class XmlScenario extends ProtoScenario<XmlResponse> {
  public readonly adapter = new NeedleAdapter();
  public readonly response = new XmlResponse(this);
  public readonly typeName = "XML";
}
