import { ProtoScenario } from "../scenario";
import { FfprobeResponse } from "./ffprobe-response";
import { fetchWithFfprobe } from "../adapters/ffprobe";

export class FfprobeScenario extends ProtoScenario {
  protected createResponse() {
    return new FfprobeResponse(this);
  }

  protected getRequestAdapter() {
    return fetchWithFfprobe;
  }
}
