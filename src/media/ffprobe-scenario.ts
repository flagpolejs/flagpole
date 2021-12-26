import { ProtoScenario } from "../scenario";
import { FfprobeResponse } from "./ffprobe-response";
import { fetchWithFfprobe } from "../adapters/ffprobe";

export class FfprobeScenario extends ProtoScenario {
  public readonly requestAdapter = fetchWithFfprobe;
  public readonly response = new FfprobeResponse(this);
}
