import { fetchWithNeedle } from "../adapters/needle";
import { ProtoScenario } from "../scenario";
import { AtomResponse } from "./atom-response";

export class AtomScenario extends ProtoScenario {
  protected createResponse() {
    return new AtomResponse(this);
  }

  protected getRequestAdapter() {
    return fetchWithNeedle;
  }
}
