import { fetchWithNeedle } from "../adapters/needle";
import { ProtoScenario } from "../scenario";
import { RssResponse } from "./rss-response";

export class RssScenario extends ProtoScenario {
  protected createResponse() {
    return new RssResponse(this);
  }

  protected getRequestAdapter() {
    return fetchWithNeedle;
  }
}
