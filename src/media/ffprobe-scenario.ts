import { AssertionContext, Value } from "..";
import { Scenario } from "../scenario";
import { FfprobeAdapter } from "./ffprobe-adapter";
import { FfprobeResponse } from "./ffprobe-response";

export class FfprobeScenario extends Scenario {
  public readonly typeName = "FFprobe";
  public readonly context = new AssertionContext(
    this,
    FfprobeAdapter,
    FfprobeResponse,
    Value
  );
}
