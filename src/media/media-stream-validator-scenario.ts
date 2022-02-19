import { AssertionContext, Value } from "..";
import { Scenario } from "../scenario";
import { MediaStreamValidatorAdapter } from "./media-stream-validator-adapter";
import { MediaStreamValidatorResponse } from "./media-stream-validator-response";

export class MediaStreamValidatorScenario extends Scenario {
  public readonly typeName = "MediaStreamValidator";
  public readonly context = new AssertionContext(
    this,
    MediaStreamValidatorAdapter,
    MediaStreamValidatorResponse,
    Value
  );
}
