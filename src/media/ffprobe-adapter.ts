import { ffprobe, FfprobeOptions } from "media-probe";
import { Adapter } from "../adapter";
import { HttpRequest } from "../http/http-request";
import { parseResponsefromJsonData } from "../http/http-response";

export class FfprobeAdapter implements Adapter {
  public async fetch(req: HttpRequest, opts?: FfprobeOptions) {
    if (!req.uri) throw "No URI set for Ffprobe";
    const data = await ffprobe(req.uri, opts);
    return parseResponsefromJsonData(data);
  }
}
