import { HttpResponse } from "../http/http-response";
import needle = require("needle");
import { ImageProbe } from "@zerodeps/image-probe";
import { KeyValue } from "../interfaces/generic-types";
import { Adapter } from "../adapter";
import { HttpRequest } from "../http/http-request";
import { getNeedleOptions, NeedleAdapterOptions } from "../adapter.needle";

interface probeImageResponse {
  headers: KeyValue;
  statusCode: number;
  url: string;
  length: number;
  imageData: probeImageData;
}

type probeImageData = {
  width: number;
  height: number;
  type: string;
  mimeType: string;
};

const fromProbeImage = (
  response: probeImageResponse,
  cookies?: KeyValue
): HttpResponse => {
  const json = {
    ...response.imageData,
    ...{
      length: response.length,
      url: response.url,
      mime: response.imageData.mimeType,
    },
  };
  return new HttpResponse({
    headers: response.headers,
    status: [response.statusCode, ""],
    jsonBody: json,
    cookies: cookies || {},
    url: response.url,
  });
};

export class ImageAdapter implements Adapter {
  public fetch(
    req: HttpRequest,
    opts?: NeedleAdapterOptions
  ): Promise<HttpResponse> {
    return new Promise((resolve, reject) => {
      const stream = needle.request(
        "get",
        req.uri || "/",
        null,
        getNeedleOptions(req)
      );
      if (opts?.redirect) {
        stream.on("redirect", opts.redirect);
      }
      // Process response
      const response: probeImageResponse = {
        statusCode: 0,
        length: 0,
        url: req.uri || "",
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
          resolve(fromProbeImage(response));
        });
    });
  }
}
