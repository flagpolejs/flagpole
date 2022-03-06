import { HttpRequest } from "..";
import { NeedleAdapter } from "../adapter.needle";
import { HTMLElement } from "../html/html-element";
import { Scenario } from "../scenario";
import { XmlResponse } from "./xml-response";

export class XmlScenario extends Scenario<
  HttpRequest,
  NeedleAdapter,
  XmlResponse,
  HTMLElement
> {
  public readonly typeName = "XML";
  public readonly request = new HttpRequest(this.opts);
  public readonly adapter = new NeedleAdapter();
  public readonly response: XmlResponse = new XmlResponse(this);
}
