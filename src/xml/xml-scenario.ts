import { NeedleAdapter } from "../adapter.needle";
import { Scenario } from "../scenario";
import { XmlResponse } from "./xml-response";

export class XmlScenario extends Scenario<XmlResponse> {
  public readonly adapter = new NeedleAdapter();
  public readonly response = new XmlResponse(this);
  public readonly typeName = "XML";
}
