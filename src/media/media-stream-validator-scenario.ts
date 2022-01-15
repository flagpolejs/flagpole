import { ProtoScenario } from "../scenario";
import { MediaStreamValidatorResponse } from "./media-stream-validator-response";
import { fetchWithMediaStreamValidator } from "./media-stream-validator-adapter";

export class MediaStreamValidatorScenario extends ProtoScenario {
  public readonly adapter = fetchWithMediaStreamValidator;
  public readonly response = new MediaStreamValidatorResponse(this);
}
