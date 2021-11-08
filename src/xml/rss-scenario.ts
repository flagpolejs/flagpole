import { fetchWithNeedle } from "../adapters/needle";
import { ProtoScenario } from "../scenario";
import { RssResponse } from "./rssresponse";

export class RssScenario extends ProtoScenario {
  protected responseClass = RssResponse;
  protected requestAdapter = fetchWithNeedle;
}
