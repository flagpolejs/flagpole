import { ProtoScenario } from "../scenario";
import { MediaStreamValidatorResponse } from "./media-stream-validator-response";
import { fetchWithMediaStreamValidator } from "../adapters/media-stream-validator";

export class MediaStreamValidatorScenario extends ProtoScenario {
  protected createResponse() {
    return new MediaStreamValidatorResponse(this);
  }

  protected getRequestAdapter() {
    return fetchWithMediaStreamValidator;
  }
}
