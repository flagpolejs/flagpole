import { HttpRequest, Value } from "..";
import { Scenario } from "../scenario";
import { MediaStreamValidatorAdapter } from "./media-stream-validator-adapter";
import { MediaStreamValidatorResponse } from "./media-stream-validator-response";

export class MediaStreamValidatorScenario extends Scenario {
  public readonly typeName = "MediaStreamValidator";
  public readonly request = new HttpRequest(this.opts);
  public readonly adapter = new MediaStreamValidatorAdapter();
  public readonly response: MediaStreamValidatorResponse =
    new MediaStreamValidatorResponse(this);
}
