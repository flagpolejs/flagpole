import { HttpRequest } from "..";
import { NeedleAdapter } from "../adapter.needle";
import { Scenario } from "../scenario";
import { RssResponse } from "./rss-response";

export class RssScenario extends Scenario {
  public readonly typeName = "RSS";
  public readonly request = new HttpRequest(this.opts);
  public readonly adapter = new NeedleAdapter();
  public readonly response: RssResponse = new RssResponse(this);
}
