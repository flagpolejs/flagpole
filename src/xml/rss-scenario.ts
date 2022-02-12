import { NeedleAdapter } from "../adapter.needle";
import { ProtoScenario } from "../scenario";
import { RssResponse } from "./rss-response";

export class RssScenario extends ProtoScenario<RssResponse> {
  public readonly adapter = new NeedleAdapter();
  public readonly response = new RssResponse(this);
  public readonly typeName = "RSS";
}
