import { Scenario } from "../scenario";
import { MediaStreamValidatorAdapter } from "./media-stream-validator-adapter";
import { MediaStreamValidatorResponse } from "./media-stream-validator-response";

export class MediaStreamValidatorScenario extends Scenario<MediaStreamValidatorResponse> {
  public readonly adapter = new MediaStreamValidatorAdapter();
  public readonly response = new MediaStreamValidatorResponse(this);
  public readonly typeName = "MediaStreamValidator";
}
