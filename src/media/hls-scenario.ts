import { AssertionContext, Value } from "..";
import { NeedleAdapter } from "../adapter.needle";
import { Scenario } from "../scenario";
import { HlsResponse } from "./hls-response";

export class HlsScenario extends Scenario {
  public readonly typeName = "HLS Manifest";
  public readonly context = new AssertionContext(
    this,
    NeedleAdapter,
    HlsResponse,
    Value
  );
}
