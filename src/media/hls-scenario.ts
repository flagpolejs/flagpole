import { HLSResponse } from "./hls-response";
import { ProtoScenario } from "../scenario";
import { fetchWithNeedle } from "../adapters/needle";

export class HlsScenario extends ProtoScenario {
  protected responseClass = HLSResponse;
  protected requestAdapter = fetchWithNeedle;
}
