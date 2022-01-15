import { HttpResponse } from "../http-response";
import { ffprobe, FfprobeOptions } from "media-probe";
import { HttpAdapter, iHttpRequest } from "../interfaces/http";

export const fetchWithFfprobe: HttpAdapter = (
  request: iHttpRequest,
  opts?: FfprobeOptions
): Promise<HttpResponse> => {
  return new Promise((resolve, reject) => {
    if (!request.uri) {
      return reject("No uri");
    }
    try {
      ffprobe(request.uri, opts).then((data) => {
        resolve(HttpResponse.fromJsonData(request, data));
      });
    } catch (err) {
      reject(err);
    }
  });
};
