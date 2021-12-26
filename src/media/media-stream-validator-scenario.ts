import { ProtoScenario } from "../scenario";
import { MediaStreamValidatorResponse } from "./media-stream-validator-response";
import { fetchWithMediaStreamValidator } from "../adapters/media-stream-validator";

export class MediaStreamValidatorScenario extends ProtoScenario {
  public readonly requestAdapter = fetchWithMediaStreamValidator;
  public readonly response = new MediaStreamValidatorResponse(this);
}
