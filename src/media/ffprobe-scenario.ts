import { Scenario } from "../scenario";
import { FfprobeAdapter } from "./ffprobe-adapter";
import { FfprobeResponse } from "./ffprobe-response";

export class FfprobeScenario extends Scenario<FfprobeResponse> {
  public readonly adapter = new FfprobeAdapter();
  public readonly response = new FfprobeResponse(this);
  public readonly typeName = "FFprobe";
}
