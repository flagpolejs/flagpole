import { HttpResponse } from "..";
import { fetchWithNeedle } from "../needle";
import { ProtoScenario } from "../scenario";
import { HtmlResponse } from "./html-response";

export class HtmlScenario extends ProtoScenario {
  public readonly requestAdapter = fetchWithNeedle;
  public readonly response = new HtmlResponse(this);
}
