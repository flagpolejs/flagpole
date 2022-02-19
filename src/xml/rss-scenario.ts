import { AssertionContext } from "..";
import { NeedleAdapter } from "../adapter.needle";
import { HTMLElement } from "../html/html-element";
import { Scenario } from "../scenario";
import { RssResponse } from "./rss-response";

export class RssScenario extends Scenario {
  public readonly typeName = "RSS";
  public readonly context = new AssertionContext(
    this,
    NeedleAdapter,
    RssResponse,
    HTMLElement
  );
}
