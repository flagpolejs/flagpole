import { fetchWithMediaStreamValidator } from "../adapters/mediastreamvalidator";
import { ProtoScenario } from "../scenario";
import { MediaStreamValidatorResponse } from "./mediastreamvalidator-response";

export class MediaStreamValidatorScenario extends ProtoScenario {
  protected responseClass = MediaStreamValidatorResponse;
  protected requestAdapter = fetchWithMediaStreamValidator;
}
