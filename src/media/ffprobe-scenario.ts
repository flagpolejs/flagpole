import { HttpRequest } from "..";
import { Scenario } from "../scenario";
import { FfprobeAdapter } from "./ffprobe-adapter";
import { FfprobeResponse } from "./ffprobe-response";

export class FfprobeScenario extends Scenario {
  public readonly typeName = "FFprobe";
  public readonly request = new HttpRequest(this.opts);
  public readonly adapter: FfprobeAdapter = new FfprobeAdapter();
  public readonly response: FfprobeResponse = new FfprobeResponse(this);
}
