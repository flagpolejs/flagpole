import { fetchWithNeedle } from "../http/needle";
import { ProtoScenario } from "../scenario";
import { HtmlResponse } from "./html-response";

export class HtmlScenario extends ProtoScenario {
  public readonly adapter = fetchWithNeedle;
  public readonly response = new HtmlResponse(this);
  public readonly typeName = "HTML";
}
