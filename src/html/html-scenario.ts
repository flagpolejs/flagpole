import { HttpRequest } from "..";
import { NeedleAdapter } from "../adapter.needle";
import { Scenario } from "../scenario";
import { HtmlResponse } from "./html-response";

export class HtmlScenario extends Scenario {
  public readonly typeName = "HTML";
  public readonly request = new HttpRequest(this.opts);
  public readonly adapter = new NeedleAdapter();
  public readonly response: HtmlResponse = new HtmlResponse(this);
}
