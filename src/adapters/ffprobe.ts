import { HttpResponse } from "../http-response";
import { ffprobe, FfprobeOptions } from "media-probe";
import { HttpRequestFetch, iHttpRequest } from "../interfaces";

export const fetchWithFfprobe: HttpRequestFetch = (
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
