import { fetchWithNeedle } from "../http/needle";
import { ProtoScenario } from "../scenario";
import { RssResponse } from "./rss-response";

export class RssScenario extends ProtoScenario {
  public readonly adapter = fetchWithNeedle;
  public readonly response = new RssResponse(this);
  public readonly typeName = "RSS";
}
