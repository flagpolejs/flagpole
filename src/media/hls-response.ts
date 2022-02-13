import { HttpResponse } from "../http/http-response";
import HLS from "parse-hls";
import { MediaResponse } from "./media-response";
import { JsonDoc, jsonFind, jsonFindAll, JsonProvider } from "../json/jpath";

export class HlsResponse extends MediaResponse implements JsonProvider {
  public json?: JsonDoc;
  protected _mimePattern = /mpegurl|octet-stream/i;

  protected get isM3U8(): boolean {
    return this.body.toString().trim().startsWith("#EXTM3U");
  }

  public init(httpResponse: HttpResponse) {
    super.init(httpResponse);
    this.context
      .assert("Content looks like M3U format", this.isM3U8)
      .equals(true);
    try {
      const manifest = HLS.parse(httpResponse.body);
      this.json = new JsonDoc(manifest.serialize());
    } catch (ex) {
      this.context.logFailure("Error parsing HLS manifest.", ex);
    }
  }

  public find = (path: string) => jsonFind(this, path);
  public findAll = (path: string) => jsonFindAll(this, path);
}
