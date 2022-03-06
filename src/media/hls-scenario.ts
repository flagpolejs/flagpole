import { JsonScenario } from "..";
import { HlsResponse } from "./hls-response";

export class HlsScenario extends JsonScenario {
  public readonly typeName = "HLS Manifest";
  public readonly response: HlsResponse = new HlsResponse(this);
}
