import { HttpResponse } from "../http-response";
import {
  mediaStreamValidator,
  MediaStreamValidatorOpts,
} from "media-stream-validator";
import { HttpRequestFetch, iHttpRequest } from "../interfaces";

export const fetchWithMediaStreamValidator: HttpRequestFetch = (
  request: iHttpRequest,
  opts?: MediaStreamValidatorOpts
): Promise<HttpResponse> => {
  return new Promise((resolve, reject) => {
    if (!request.uri) {
      return reject("No uri");
    }
    try {
      mediaStreamValidator(request.uri, opts).then((data) => {
        resolve(HttpResponse.fromJsonData(request, data));
      });
    } catch (err) {
      reject(err);
    }
  });
};
