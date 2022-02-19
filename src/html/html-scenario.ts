import { AssertionContext } from "..";
import { NeedleAdapter } from "../adapter.needle";
import { Scenario } from "../scenario";
import { HTMLElement } from "./html-element";
import { HtmlResponse } from "./html-response";

export class HtmlScenario extends Scenario {
  public readonly typeName = "HTML";
  public readonly context = new AssertionContext(
    this,
    NeedleAdapter,
    HtmlResponse,
    HTMLElement
  );
}
