import { fetchWithNeedle } from "../needle";
import { ProtoScenario } from "../scenario";
import { RssResponse } from "./rss-response";

export class RssScenario extends ProtoScenario {
  public readonly requestAdapter = fetchWithNeedle;
  public readonly response = new RssResponse(this);
}
