import { fetchWithFfprobe } from "../adapters/ffprobe";
import { ProtoScenario } from "../scenario";
import { FfprobeResponse } from "./ffprobe-response";

export class FfprobeScenario extends ProtoScenario {
  protected responseClass = FfprobeResponse;
  protected requestAdapter = fetchWithFfprobe;
}
