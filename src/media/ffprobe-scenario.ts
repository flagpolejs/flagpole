import { ProtoScenario } from "../scenario";
import { FfprobeResponse } from "./ffprobe-response";
import { fetchWithFfprobe } from "./ffprobe-adapter";

export class FfprobeScenario extends ProtoScenario {
  public readonly adapter = fetchWithFfprobe;
  public readonly response = new FfprobeResponse(this);
  public readonly typeName = "FFprobe";
}
