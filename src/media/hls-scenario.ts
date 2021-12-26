import { ProtoScenario } from "../scenario";
import { HLSResponse } from "..";
import { fetchWithNeedle } from "../adapters/needle";

export class HlsScenario extends ProtoScenario {
  protected createResponse() {
    return new HLSResponse(this);
  }

  protected getRequestAdapter() {
    return fetchWithNeedle;
  }
}
