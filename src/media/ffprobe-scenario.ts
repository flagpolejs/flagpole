import { ProtoScenario } from "../scenario";
import { FfprobeAdapter } from "./ffprobe-adapter";
import { FfprobeResponse } from "./ffprobe-response";

export class FfprobeScenario extends ProtoScenario<FfprobeResponse> {
  public readonly adapter = new FfprobeAdapter();
  public readonly response = new FfprobeResponse(this);
  public readonly typeName = "FFprobe";
}
