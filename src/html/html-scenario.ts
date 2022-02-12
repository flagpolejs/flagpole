import { NeedleAdapter } from "../adapter.needle";
import { ProtoScenario } from "../scenario";
import { HtmlResponse } from "./html-response";

export class HtmlScenario extends ProtoScenario<HtmlResponse> {
  public readonly adapter = new NeedleAdapter();
  public readonly response = new HtmlResponse(this);
  public readonly typeName = "HTML";
}
