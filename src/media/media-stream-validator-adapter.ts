import { parseResponsefromJsonData } from "../http/http-response";
import {
  mediaStreamValidator,
  MediaStreamValidatorOpts,
} from "media-stream-validator";
import { Adapter } from "../adapter";
import { HttpRequest } from "../http/http-request";

export class MediaStreamValidatorAdapter implements Adapter {
  public async fetch(req: HttpRequest, opts?: MediaStreamValidatorOpts) {
    if (!req.uri) throw "No URI set for Media Stream Validator";
    const data = await mediaStreamValidator(req.uri, opts);
    return parseResponsefromJsonData(data);
  }
}
