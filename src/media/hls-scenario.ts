import { NeedleAdapter } from "../adapter.needle";
import { Scenario } from "../scenario";
import { HlsResponse } from "./hls-response";

export class HlsScenario extends Scenario<HlsResponse> {
  public readonly adapter = new NeedleAdapter();
  public readonly response = new HlsResponse(this);
  public readonly typeName = "HLS Manifest";
}
