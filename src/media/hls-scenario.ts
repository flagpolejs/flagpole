import { ProtoScenario } from "../scenario";
import { HlsResponse } from "./hls-response";
import { fetchWithNeedle } from "../http/needle";

export class HlsScenario extends ProtoScenario {
  public readonly adapter = fetchWithNeedle;
  public readonly response = new HlsResponse(this);
  public readonly typeName = "HLS Manifest";
}
