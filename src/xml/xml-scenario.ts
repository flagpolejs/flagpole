import { AssertionContext } from "..";
import { NeedleAdapter } from "../adapter.needle";
import { HTMLElement } from "../html/html-element";
import { Scenario } from "../scenario";
import { XmlResponse } from "./xml-response";

export class XmlScenario extends Scenario {
  public readonly typeName = "XML";
  public readonly context = new AssertionContext(
    this,
    NeedleAdapter,
    XmlResponse,
    HTMLElement
  );
}
