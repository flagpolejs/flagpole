import { NeedleAdapter } from "../adapter.needle";
import { ProtoScenario } from "../scenario";
import { HlsResponse } from "./hls-response";

export class HlsScenario extends ProtoScenario<HlsResponse> {
  public readonly adapter = new NeedleAdapter();
  public readonly response = new HlsResponse(this);
  public readonly typeName = "HLS Manifest";
}
