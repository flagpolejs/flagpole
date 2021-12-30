import { ProtoScenario } from "../scenario";
import { HlsResponse } from "./hls-response";
import { fetchWithNeedle } from "../needle";

export class HlsScenario extends ProtoScenario {
  public readonly requestAdapter = fetchWithNeedle;
  public readonly response = new HlsResponse(this);
}
