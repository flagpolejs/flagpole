import { HttpResponse } from "../http-response";
import { HttpRequestFetch, iHttpRequest, KeyValue } from "../interfaces";
import needle = require("needle");
import { getNeedleOptions } from "./needle";
import { ImageProbe } from "@zerodeps/image-probe";

export interface probeImageResponse {
  headers: KeyValue;
  statusCode: number;
  url: string;
  length: number;
  imageData: probeImageData;
}

export type probeImageData = {
  width: number;
  height: number;
  type: string;
  mimeType: string;
};

export const fetchImageWithNeedle: HttpRequestFetch = (
  request: iHttpRequest,
  opts?: KeyValue
): Promise<HttpResponse> => {
  return new Promise((resolve, reject) => {
    const stream = needle.request(
      "get",
      request.uri || "/",
      null,
      getNeedleOptions(request)
    );
    if (opts?.redirect) {
      stream.on("redirect", opts.redirect);
    }
    // Process response
    const response: probeImageResponse = {
      statusCode: 0,
      length: 0,
      url: request.uri || "",
      headers: {},
      imageData: {
        width: 0,
        height: 0,
        type: "",
        mimeType: "",
      },
    };
    stream
      .on("header", (statusCode: number, headers: KeyValue) => {
        response.statusCode = statusCode;
        response.headers = headers;
        response.length = Number(headers["content-length"]);
        response.imageData.mimeType = headers["content-type"];
      })
      .on("readable", () => {
        // Read the first 512 bytes and process image
        const chunk = <Buffer>stream.read(512);
        if (chunk) {
          response.imageData =
            ImageProbe.fromBuffer(chunk) || response.imageData;
        }
        // We have enough! Stop processing any more data!
        stream.pause();
        try {
          // @ts-ignore
          stream.destroy();
        } catch {}
        // Set the response
        resolve(HttpResponse.fromProbeImage(response));
      });
  });
};
